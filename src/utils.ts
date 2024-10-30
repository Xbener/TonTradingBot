import { encodeTelegramUrlParameters, isTelegramUrl, WalletInfoRemote } from '@tonconnect/sdk';
import { InlineKeyboardButton, Message } from 'node-telegram-bot-api';
import { bot } from './bot';
import { fetchDataGet, fetchPrice, Jetton } from './dedust/api';

export const AT_WALLET_APP_NAME = 'telegram-wallet';

export const pTimeoutException = Symbol();

export function pTimeout<T>(
    promise: Promise<T>,
    time: number,
    exception: unknown = pTimeoutException
): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    return Promise.race([
        promise,
        new Promise((_r, rej) => (timer = setTimeout(rej, time, exception)))
    ]).finally(() => clearTimeout(timer)) as Promise<T>;
}

export function addTGReturnStrategy(link: string, strategy: string): string {
    const parsed = new URL(link);
    parsed.searchParams.append('ret', strategy);
    link = parsed.toString();

    const lastParam = link.slice(link.lastIndexOf('&') + 1);
    return link.slice(0, link.lastIndexOf('&')) + '-' + encodeTelegramUrlParameters(lastParam);
}

export function convertDeeplinkToUniversalLink(link: string, walletUniversalLink: string): string {
    const search = new URL(link).search;
    const url = new URL(walletUniversalLink);

    if (isTelegramUrl(walletUniversalLink)) {
        const startattach = 'tonconnect-' + encodeTelegramUrlParameters(search.slice(1));
        url.searchParams.append('startattach', startattach);
    } else {
        url.search = search;
    }

    return url.toString();
}


export async function getPriceStr(jettons:string[],mainId:number){
    let assets: Jetton[] = await fetchDataGet('/assets');
    let addresses = ['',''];
    let decimals = [0,0]
  
    let price: number = await fetchPrice(10 ** decimals[1-mainId]!, addresses[1 - mainId]!, addresses[mainId]!)
    price /= 10 ** decimals[mainId]!;
    
    const strPrice = price.toFixed(Math.log10(price) <0 ? -1 * Math.ceil(Math.log10(price)) + 2 : 0);
    console.log(strPrice, addresses)
    return strPrice;
}
(async ()=>{ 
    await getPriceStr(['TON','jUSDT'],0);
}) ()
