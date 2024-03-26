import dotenv from 'dotenv';
dotenv.config();

import { bot } from './bot';
import { walletMenuCallbacks } from './connect-wallet-menu';
import {
    handleConnectCommand,
    handleDisconnectCommand,
    handleSendTXCommand,
    handleShowMyWalletCommand
} from './commands-handlers';
import { initRedisClient } from './ton-connect/storage';
import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import TonWeb from 'tonweb';
import { User, getUserByTelegramID, createUser, connect, updateUserState } from './ton-connect/mongo';

const nacl = TonWeb.utils.nacl;
let tonWeb = new TonWeb();

async function main(): Promise<void> {
    await initRedisClient();
    await connect();
    const callbacks = {
        ...walletMenuCallbacks
    };

    bot.on('callback_query', query => {
        if (!query.data) {
            return;
        }

        let request: { method: string; data: string };

        try {
            request = JSON.parse(query.data);
        } catch {
            return;
        }

        if (!callbacks[request.method as keyof typeof callbacks]) {
            return;
        }

        callbacks[request.method as keyof typeof callbacks](query, request.data);
    });

    bot.on('message', msg => {
        const userState = getUserByTelegramID(msg.from?.id);
        if (userState == 'waitForTraingToken') {
            updateUserState(msg.from?.id, 'waitForChoosePair');
            global.userMessage = msg.text;
        }
        if (msg.text.toString().toLowerCase().indexOf(Hi) === 0) {
            bot.sendMessage(msg.chat.id,"Hello dear user");
        }

    });

    bot.onText(/\/connect/, handleConnectCommand);

    bot.onText(/\/deposit/, handleSendTXCommand);

    bot.onText(/\/disconnect/, handleDisconnectCommand);

    bot.onText(/\/my_wallet/, handleShowMyWalletCommand);

    bot.onText(/\/start/, async (msg: TelegramBot.Message) => {

        let prevUser = await getUserByTelegramID(String(msg.from?.id));
        let telegramWalletAddress;
        let message;

        if (prevUser){
             message = 'Welcome Back! ' + msg.from?.first_name;
             telegramWalletAddress = prevUser.walletAddress;
            }
        else {
            //create a new wallet
            const keyPair = nacl.sign.keyPair();
            let wallet = tonWeb.wallet.create({ publicKey: keyPair.publicKey, wc: 0 });
            const address = await wallet.getAddress();
            const seqno = await wallet.methods.seqno().call();
            const deploy = wallet.deploy(keyPair.secretKey);
            const deployFee = await deploy.estimateFee();
            const deploySended = await deploy.send();
            const deployQuery = await deploy.getQuery();
            //save in db
            let newUser: User = {
                telegramID: String(msg.from?.id),
                walletAddress: address.toString(true,true,false),
                secretKey: keyPair.secretKey.toString(),
            };
            await createUser(newUser);
            //save in variable to show
            telegramWalletAddress = address.toString(true,true,false);

        }
        bot.sendMessage(
            msg.chat.id,
            `
Your telegram Wallet Address : ${telegramWalletAddress}
Commands list: 
/trade - Start trading
/connect - Connect your wallet
/my_wallet - Show connected wallet
/deposit - Deposit jettons to telegram wallet 
/withdraw - Withdraw jettons from telegram wallet
/disconnect - Disconnect from the wallet
`
        );
    });
}
const app = express();
app.use(express.json());
app.listen(10000, () => {
    console.log(`Express server is listening on 10000`);
});
main(); 