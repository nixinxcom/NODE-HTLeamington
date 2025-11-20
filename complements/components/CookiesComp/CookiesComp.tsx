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
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

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
                <P className={styles.CookieLegend}>{coockieTitle}</P>
                    <div className={styles.Btns}>
                        <div className={styles.cookieBtn} onClick={() => {UpdateUserState({UserState: userState, keyPath: 'Digital.Cookies', updatedValue: false, replace: false}), setViewCookiesContract(false), setState(false)}}>
                            <P className={styles.BtnLegend}><FM id="global.Reject" defaultMessage="Reject"/></P>
                        </div>
                        <div className={styles.cookieBtn} onClick={() => {UpdateUserState({UserState: userState, keyPath: 'Digital.Cookies', updatedValue: true, replace: false}), setViewCookiesContract(false), setState(true)}}>
                            <P className={styles.BtnLegend}><FM id="global.Accept" defaultMessage="Accept"/></P>
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
                <SPAN id={styles.cookiesnotification} className={classNames} onClick={()=>setViewCookiesContract(!ViewCookiesContract)}><FM id="global.Read" defaultMessage="Read"/></SPAN>
            </div>
            {ViewCookiesContract && 
                <div className={styles.coockieWindow} style={styles}>
                    <div className={styles.contract}>{contract}</div>
                    <BUTTON className={styles.cookieBtn} onClick={()=>setViewCookiesContract(!ViewCookiesContract)}><FM id="global.ClosePopUp" defaultMessage="Close"/></BUTTON>
                </div>
            }
        </>
    )
}