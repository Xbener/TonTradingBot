import { CHAIN, isTelegramUrl, toUserFriendlyAddress, UserRejectsError } from '@tonconnect/sdk';
import { bot } from './bot';
import { getWallets, getWalletInfo } from './ton-connect/wallets';
import QRCode from 'qrcode';
import TelegramBot, { CallbackQuery, InlineKeyboardButton,Message } from 'node-telegram-bot-api';
import { getConnector } from './ton-connect/connector';
import { addTGReturnStrategy, buildUniversalKeyboard, getPriceStr, pTimeout, pTimeoutException , replyMessage} from './utils';
import { addOrderingDataToUser, createUser, getPools, getPoolWithCaption, getUserByTelegramID, OrderingData, updateUserMode, updateUserState,User, UserModel } from './ton-connect/mongo';
import TonWeb from 'tonweb';
import nacl from 'tweetnacl';
import { fetchDataGet, Jetton, walletAsset } from './dedust/api';
import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';
import { TonClient4, WalletContractV4 } from 'ton';
import { dealOrder } from './dedust/dealOrder';
import mongoose, { Callback } from 'mongoose';
let tonWeb = new TonWeb();

let newConnectRequestListenersMap = new Map<number, () => void>();
const tonClient = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });

export const commandCallback = {
    tradingCallback:handleTradingCallback,
    addNewOrder:handleAddNewOrder
}
async function handleAddNewOrder(query: CallbackQuery){
    console.log(query);
    const user = await getUserByTelegramID(query.message?.chat!.id!);
    let newOrder = {
        _id:  new mongoose.Types.ObjectId(),
        amount: user?.state.amount!,
        jettons: user?.state.jettons!,
        mainCoin: user?.state.mainCoin!,
        isBuy: user?.state.isBuy!,
        price: user?.state.price!,
        state: ''
    };
    //check balance
    
    let mainId = 0, flag = false;
    const pool = await getPoolWithCaption(user?.state.jettons!);
    const walletBalance: walletAsset[] = await fetchDataGet(`/accounts/${user?.walletAddress}/assets`);
    
    
    console.log(flag);
    if(user?.state.isBuy )
        if(walletBalance[0]?.balance! >= user?.state.amount) {
            await addOrderingDataToUser(query.message?.chat!.id!, newOrder);
            //const priceStr = getPriceStr(user.state.jettons,user.state.mainCoin);
            //newOrder.amount *= user.state.isBuy ? user.state.price : 1/user.state.price
            bot.sendMessage(query.message!.chat.id,`New Order is Succesfuly booked, Press /start`);
        }
        else bot.sendMessage(query.message!.chat.id,`New Order is failed due to invalid balance, Press /start`);
    else{
            })
            if(flag) return;
        })
    }
}
export async function handleOrderCommand(msg: TelegramBot.Message){
    let user = await getUserByTelegramID(msg?.chat!.id!);
    let state = user?.state;
    state!.state = 'waitfororder';
    updateUserState(msg?.chat!.id!, state!);
}
async function handleTradingCallback (query: CallbackQuery, _:string){
    try {
        //update user state string
        
        let user = await getUserByTelegramID(query.message?.chat!.id!);
        user!.state.state = 'selectPair';
        user!.state.isBuy = _ == 'true';
        console.log('trading',_)
        updateUserMode(query.message?.chat!.id!, '');
        updateUserState(query.message?.chat!.id!, user!.state);
        //fetch assets from dedust API
        const pools = await getPools();
        const rows = Math.ceil(pools!.length / 4);

        // let keyboardArray: InlineKeyboardButton[][] = []; // Type annotation for keyboardArray
        // const filteredAssets = pools!.filter(pool => pool !== undefined);
        // filteredAssets.map((pool, index) => {
        //     if (!!!keyboardArray[Math.floor(index / 4)]) keyboardArray[Math.floor(index / 4)] = [];
        //     const caption = pool.caption[0]! + '/' + pool.caption[1]!;
        //     keyboardArray[Math.floor(index / 4)]![index % 4] = {text: caption, callback_data: `symbol-${caption}`};
        // });
        // keyboardArray.push([{text:'<< Back', callback_data: 'newStart'}]);
    
        await bot.editMessageText(
            `🏃 Trading\n\n💡Please type in Jetton's Symbol/Name/address\n\nFor example:\n🔸"jUSDT" or "jusdt" or "JUSDT"\n🔸"Ton Bridge USD"\n🔸"EQBynBO23yw ... STQgGoXwiuA"`,
            {
                message_id: query.message?.message_id,
                chat_id: query.message?.chat.id
            }
        )
        await bot.editMessageReplyMarkup(
            { inline_keyboard: [[{text:'<< Back', callback_data: 'symbol-selectPair'}]] },
            {
                message_id: query.message?.message_id,
                chat_id: query.message?.chat.id
            }
        );
            
    } catch (error) {
        console.log(error)
    }
}
export async function handleOrderingBookCommand(query: CallbackQuery){
    let user = await getUserByTelegramID(query.message!.chat.id);
    let orderingBtns: InlineKeyboardButton[][] = [];
    user?.orderingData?.map((order,index)=>{
        if(orderingBtns[index])orderingBtns[index] = [];
        orderingBtns[index] = [{text: order.isBuy?'Buy ' + order.jettons[1-order.mainCoin] + ' from ' + order.amount + ' ' + order.jettons[order.mainCoin] + ' at 1' + order.jettons[1- order.mainCoin] + '=' + order.price + ' ' + order.jettons[order.mainCoin]:'Sell '+order.amount + ' ' + order.jettons[1-order.mainCoin] + ' at 1 ' + order.jettons[1- order.mainCoin] + '=' + order.price + ' ' + order.jettons[order.mainCoin]
        ,callback_data: 'orderclick-' + order._id.toHexString()}]
    })
    
}
export async function handleStartCommand (msg: TelegramBot.Message)  {
    //update / create user info
    const userId = msg.chat?.id ?? 0;
    let prevUser = await getUserByTelegramID(userId);
    let telegramWalletAddress;
    let message;

    if (prevUser){
         message = 'Welcome Back! ' + msg.chat?.first_name;
         telegramWalletAddress = prevUser.walletAddress;
         //set userstate idle
         updateUserState(userId,{
            _id: new mongoose.Types.ObjectId(),
            state: 'idle',
            jettons: ['',''],
            mainCoin: 0,
            amount: 0,
            price: 0,
            isBuy: false
        });
        }
    else {
        //create a new wallet
        // const keyPair = nacl.sign.keyPair();
        // let wallet = tonWeb.wallet.create({ publicKey: keyPair.publicKey, wc: 0 });
        // const address = await wallet.getAddress();
        // const seqno = await wallet.methods.seqno().call();
        // const deploy = wallet.deploy(keyPair.secretKey);
        // const deployFee = await deploy.estimateFee();
        // const deploySended = await deploy.send();
        // const deployQuery = await deploy.getQuery();
        //save in db
        
        await createUser(newUser);
        //save in variable to show
        telegramWalletAddress = address.toString();
    }
    
    bot.sendMessage(
        msg.chat.id,
        `🏆<b>RewardBot</b>🏆\n
👏Welcome to <b>RewardBot</b>.
<b>RewardBot</b> can provide you with a good trading environment <b>Anytime</b>, <b>Anywhere</b>, <b>Anyone</b> 

`,{
    reply_markup:{
        inline_keyboard:[
            [{text:'💵 My wallet', callback_data:'showMyWallet'}],
            [{text:'♻️ Instant Swap', callback_data:'instanteSwap'},{text:'🏃 Book Order',/*web_app:{url:'https://web.ton-rocket.com/trade'}*/ callback_data:'symbol-selectPair'}],
            [{text:'🔨 Tools and Settings', callback_data:'setting'}],
            //[{text:'🔗 Connect Your Wallet',callback_data:'walletConnect'},{text:'✂ Disconnect Wallet', callback_data:'disConnect'}],
            //[{text:'📤 Deposit', callback_data:'deposit'},{text:'📥 Withdraw', callback_data:'withdraw'}],
        ]
    },
    parse_mode:'HTML'
    }
    );
}

export async function handleConnectCommand(msg: TelegramBot.Message): Promise<void> {
    console.log('connect!!');
    const chatId = msg.chat.id;
    let messageWasDeleted = false;

    newConnectRequestListenersMap.get(chatId)?.();

    const connector = getConnector(chatId, () => {
 //       unsubscribe();
//        newConnectRequestListenersMap.delete(chatId);
//        deleteMessage();
    });

    await connector.restoreConnection();
    if (connector.connected) {
        const connectedName =
            (await getWalletInfo(connector.wallet!.device.appName))?.name ||
            connector.wallet!.device.appName;
        await bot.sendMessage(
            chatId,
            `🔗 Connect Wallet\n\n💡You have already connect ${connectedName} wallet\nYour address: ${toUserFriendlyAddress(
                connector.wallet!.account.address,
                connector.wallet!.account.chain === CHAIN.MAINNET
            )}\n\n Disconnect wallet firstly to connect a new one`,{
                reply_markup: {
                    inline_keyboard: [
                        [{text:'<< Back', callback_data: 'newStart'}]
                    ]
                }
            }
        );

        return;
    }

   

    const deleteMessage = async (): Promise<void> => {
        if (!messageWasDeleted) {
            messageWasDeleted = true;
            await bot.deleteMessage(chatId, botMessage.message_id);
        }
    };

    newConnectRequestListenersMap.set(chatId, async () => {
        unsubscribe();

        await deleteMessage();

        newConnectRequestListenersMap.delete(chatId);
    });
}
export async function handleSettingCommand(query: CallbackQuery): Promise<void> {
    replyMessage(query.message!,`🔨 Tools and Settings\n\n
    Please <b>Connect Wallet</b> to <b>Deposit</b> and <b>Start Trading</b>.`,
    [
        [{text:'🔗 Connect Your Wallet',callback_data:'walletConnect'},{text:'✂ Disconnect Wallet', callback_data:'disConnect'}],
        [{text:'📤 Deposit', callback_data:'deposit'},{text:'📥 Withdraw', callback_data:'withdraw'}],
        [{text:'🛟 Backup', callback_data:'backup'}],
        [{text:'<< Back', callback_data:'newStart' }]
    ])
}
export async function handleBackupCommand(query: CallbackQuery): Promise<void> {
    const user = await getUserByTelegramID(query.message?.chat!.id!);
    replyMessage(query.message!,`🔨 Tools and Settings\n\n${user?.secretKey}`,
    [
        [{text:'<< Back', callback_data:'setting' }]
    ])
}
export async function handleSendTXCommand(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    const connector = getConnector(chatId);

    await connector.restoreConnection();
    if (!connector.connected) {
        await bot.sendMessage(chatId, '💡Connect wallet to deposit');
        return;
    }

   
        .then(() => {
            bot.sendMessage(chatId, `💡Transaction sent successfully`);
        })
        .catch(e => {
            if (e === pTimeoutException) {
                bot.sendMessage(chatId, `💡Transaction was not confirmed`);
                return;
            }

            if (e instanceof UserRejectsError) {
                bot.sendMessage(chatId, `💡You rejected the transaction`);
                return;
            }

            bot.sendMessage(chatId, `💡Unknown error happened`);
        })
        .finally(() => connector.pauseConnection());

  
}

export async function handleDisconnectCommand(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    const connector = getConnector(chatId);

 
}

export async function handleDepositCommand(query: CallbackQuery){
    const user = await getUserByTelegramID(query.message?.chat!.id!);

    replyMessage(query.message!, `📤 Deposit\n\n💡Your RewardBot Wallet Address is \n<code>${user?.walletAddress}</code>`,[[{text:'<< Back', callback_data: 'newStart'}]])
}

export async function handleWithdrawCommand(query: CallbackQuery){
    

}

export async function handleShowMyWalletCommand(msg: TelegramBot.Message): Promise<void> {
    // const chatId = msg.chat.id;

    // const connector = getConnector(chatId);

    // await connector.restoreConnection();
    // if (!connector.connected) {
    //     await bot.sendMessage(chatId, "You didn't connect a wallet");
    //     return;
    // }


    console.log(msg);

   
}

export async function handleInstanteSwap(query: CallbackQuery): Promise<void> {
    try{

    } catch (error) {
        console.log(error)
    }
}
