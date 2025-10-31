'use-client'
//Libraries
import React, { useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import Image from 'next/image';
import UpdateUserState from '../../../functionalities/CommonFunctions/UpdateUserStateFunc';
import { FormattedMessage } from 'react-intl';
import FM from "../../../complements/i18n/FM";
//Styles
import styles from './CookiesComp.module.css';

interface ICookie{
    contract: any,
    setState?: any,
    coockieTitle: string
    coockieIcon: string,
    coockieAlt: string,
    style?: {},
    classNames?: string,
}

export default function CookiesComp({contract, setState, coockieTitle, coockieIcon, coockieAlt, style, classNames}: ICookie){
    const {userState} = useAppContext()
    const [ViewCookiesContract, setViewCookiesContract] = useState(false)

    return (
        <>
            <div className={styles.CookiePoint} style={style}>
                <p className={styles.CookieLegend}>{coockieTitle}</p>
                    <div className={styles.Btns}>
                        <div className={styles.cookieBtn} onClick={() => {UpdateUserState({UserState: userState, keyPath: 'Digital.Cookies', updatedValue: false, replace: false}), setViewCookiesContract(false), setState(false)}}>
                            <p className={styles.BtnLegend}><FM id="global.Reject" defaultMessage="Reject"/></p>
                        </div>
                        <div className={styles.cookieBtn} onClick={() => {UpdateUserState({UserState: userState, keyPath: 'Digital.Cookies', updatedValue: true, replace: false}), setViewCookiesContract(false), setState(true)}}>
                            <p className={styles.BtnLegend}><FM id="global.Accept" defaultMessage="Accept"/></p>
                        </div>
                    </div>
                    <div>
                        <Image
                            id={styles.Coockimage}
                            src={coockieIcon}
                            alt={coockieAlt}
                            width={35}
                            height={35}
                        />
                    </div>
                <span id={styles.cookiesnotification} className={classNames} onClick={()=>setViewCookiesContract(!ViewCookiesContract)}><FM id="global.Read" defaultMessage="Read"/></span>
            </div>
            {ViewCookiesContract && 
                <div className={styles.coockieWindow} style={styles}>
                    <div className={styles.contract}>{contract}</div>
                    <button className={styles.cookieBtn} onClick={()=>setViewCookiesContract(!ViewCookiesContract)}><FM id="global.ClosePopUp" defaultMessage="Close"/></button>
                </div>
            }
        </>
    )
}