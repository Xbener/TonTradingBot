import { Factory, JettonWallet, MAINNET_FACTORY_ADDR, VaultJetton } from '@dedust/sdk';
import { Address, TonClient4, Sender, WalletContractV3R2, WalletContractV4 } from '@ton/ton';
import { Cell, OpenedContract, beginCell, ContractProvider, internal,  toNano } from '@ton/core';
import { Asset, PoolType, ReadinessStatus, JettonRoot } from '@dedust/sdk';
import axios from 'axios';
import { mnemonicToPrivateKey, mnemonicToWalletKey } from '@ton/crypto';

import { Pool, createPool, deletePoolsCollection, getPoolWithCaption } from '../ton-connect/mongo';
import { number } from 'yargs';
import { bigint } from 'zod';
import { takeCoverage } from 'v8';
import TonWeb from 'tonweb';
import { Contract, storeMessageRelaxed } from 'ton-core';
const tonClient = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });
const factory = tonClient.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));

export interface Jetton{
    type: string,
    address: string,
    name: string,
    symbol: string,
    image: string
    decimals: number,
    riskScore: string,
}

export interface walletAsset{
    address: string,
    asset:{
        type: string,
        address: string
    },
    balance: bigint
}

export interface PriceResult{
    pool:{
        address: string,
        isStable: false,
        assets: string[],
        reserves: string[],
    },
    amountIn: bigint,
    amountOut: bigint,
    tradeFee: bigint,
    assetIn: string,
    assetOut: string
}

//main();
//fetchPrice(1000000000,'native','EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA');
