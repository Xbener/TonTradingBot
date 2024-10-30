import TonWeb from "tonweb";
import { deleteOrderingDataFromUser, getAllUsers, getPoolWithCaption } from "../ton-connect/mongo";
import { Address, TonClient4, WalletContractV4 } from "@ton/ton";
import { keyPairFromSecretKey, mnemonicToPrivateKey } from "@ton/crypto";
import { fetchPrice, jetton_to_Jetton, jetton_to_Ton, ton_to_Jetton } from "./api";
const tonClient = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });
import {bot} from '../bot'

export async function dealOrder(){
    console.log('dealing order started')
    const users = await getAllUsers();
    users!.map(async (user) =>{
        
        let mnemonic = user.secretKey.split(',')
        let keyPair = await mnemonicToPrivateKey(mnemonic);
        
        const wallet = tonClient.open(
            WalletContractV4.create({
                workchain: 0,
                publicKey: keyPair!.publicKey
            })
        );
        let sender = await wallet.sender(keyPair.secretKey);
    })
    console.log('==>dealing order Finished<==');


}
