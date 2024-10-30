import dotenv from 'dotenv';
dotenv.config();

import { bot } from './bot';
import { walletMenuCallbacks } from './connect-wallet-menu';
import {
    handleBackupCommand,
    handleConnectCommand,
    handleDepositCommand,
    handleDisconnectCommand,
    handleInstanteSwap,
    handleOrderCommand,
    handleOrderingBookCommand,
    handleSendTXCommand,
    handleSettingCommand,
    handleShowMyWalletCommand,
    handleStartCommand,
    handleWithdrawCommand
} from './commands-handlers';
import { initRedisClient } from './ton-connect/storage';
import TonWeb from 'tonweb';
import { Pool, connect, deleteOrderingDataFromUser, getPoolWithCaption, getUserByTelegramID, updateUserState } from './ton-connect/mongo';
import { commandCallback } from './commands-handlers';
import TelegramBot, { CallbackQuery, InlineKeyboardButton, Message } from 'node-telegram-bot-api';
import { Jetton, fetchDataGet, fetchPrice, getPair, sendJetton, sendTon, walletAsset } from './dedust/api';
import { dealOrder } from './dedust/dealOrder';
import { getPriceStr, replyMessage } from './utils';
import { getConnector } from './ton-connect/connector';
import { CHAIN, toUserFriendlyAddress } from '@tonconnect/sdk';
import { mnemonicToWalletKey } from 'ton-crypto';
var sys   = require('sys'),
    exec  = require('child_process').exec


import { Address } from '@ton/core';
import mongoose from 'mongoose';
const nacl = TonWeb.utils.nacl;
let tonWeb = new TonWeb();

(async() => await getPair())();
setInterval(getPair,600000);
//setTimeout(() => setInterval(dealOrder,30000),10000)


async function main(): Promise<void> {
    await initRedisClient();
    await connect();
    const callbacks = {
        ...walletMenuCallbacks,
        ...commandCallback
    };

    bot.on('callback_query', async query => {
        if (!query.data) {
            return;
        }
        switch (query.data) {
            case 'newStart':
                handleStartCommand(query.message!);
                return;
            case 'walletConnect':
                handleConnectCommand(query.message!);
                return;
            case 'showMyWallet':
                handleShowMyWalletCommand(query.message!);
                return;
            case 'disConnect':
                handleDisconnectCommand(query.message!);
                return;
            case 'deposit':
                handleDepositCommand(query);
                return;
            case 'withdraw':
                handleWithdrawCommand(query);
                return;
            case 'instanteSwap':
                handleInstanteSwap(query);
                return;
            case 'setting':
                handleSettingCommand(query);
                return;
            case 'backup':
                handleBackupCommand(query);
                return;
            case 'orderingBook':
                handleOrderingBookCommand(query);
                return;
            default:
                break;
        }
        
    bot.onText(/\/connect/, handleConnectCommand);

    bot.onText(/\/deposit/, handleSendTXCommand);

    bot.onText(/\/disconnect/, handleDisconnectCommand);

    bot.onText(/\/my_wallet/, handleShowMyWalletCommand);

    bot.onText(/\/start/, handleStartCommand);

    bot.onText(/\/order/,handleOrderCommand);
}
try {
    main(); 
} catch (error) {
    console.log(error)
}

