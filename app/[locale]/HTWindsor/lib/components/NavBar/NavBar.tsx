'use client'
import React, { useState } from "react";
import styles from "./NavBar.module.css";
import { FormattedMessage, FormattedNumber } from 'react-intl';
import FM from "@/complements/i18n/FM";
import { BUTTON, LINK, NEXTIMAGE, IMAGE, DIV, INPUT, SELECT, LABEL, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";
import { useI18nHref } from '@/app/lib/useI18nHref';
import { useEffect } from "react";
import { onAuthStateChanged, signInAnonymously, signOut } from "firebase/auth";
// NavBar.tsx (fragmento relevante)
import { FbAuth } from "@/app/lib/services/firebase";
import { useAuth } from '@/complements/components/AuthenticationComp/AuthContext';
import { useRouter } from 'next/navigation';
import ThemeToggle from "@/complements/components/ThemeToggle/ThemeToggle";

interface INavBar{
    FormattedMessage: string,
    linkURL: string
    defaultMessage?: string,
    openTarget?: 'local' | 'external'
}

interface iPlatforms{
    PName?: string,
    PIcon?: string,
    PUrl: string,
}

interface iSocMed{
    PName?: string,
    PIcon?: string,
    PUrl: string,
}

interface iBotons{
    Logo?: string,
    SocMed?: iSocMed[],
    DeliveryPlatforms?: iPlatforms[],
    Botons: INavBar[],
    onMenuToggle?: (open: boolean) => void;
}

export default function NavBar(props: iBotons){
    const i18nHref = useI18nHref(); // ← OBTÉN LA FUNCIÓN AQUÍ
    const [MenuDisplay, setMenuDisplay] = useState<boolean>(false)
    const [authUser, setAuthUser] = useState<any>(null);
    const { user, isAnonymous, logout, signInAnon } = useAuth();
    const router = useRouter();

    useEffect(() => {
    const unsub = onAuthStateChanged(FbAuth, (u) => setAuthUser(u));
        return () => unsub();
    }, []);

    const handleGuest = async () => {
        if (!user) {  // Si no hay sesión, inicia sesión anónima
            try { await signInAnon(); } catch {}
        }
    };

    const handleLogout = async () => {
        try {
            await logout();               // Cierra sesión en Firebase
            router.push(i18nHref('/login'));  // Redirige de forma segura a la pantalla de login
        } catch {}
    };

    return (
        <nav className={styles.NavBarContainer}>
            {props.Logo && (
                <div className={`${styles.LogoContainer} ${MenuDisplay ? styles.LogoHiden : ''}`}>
                    <LINK href={i18nHref('/')}>
                        <IMAGE className={styles.Logo} priority src={props.Logo} width={90} height={90} alt="Logo" />
                    </LINK>
                </div>
            )}
            <div className={styles.HamburgerMenu} onClick={() => setMenuDisplay(!MenuDisplay)}>
                <IMAGE src="/Icons/MenuIcon.png" width={28} height={28} alt="Menu" />
            </div>
            <div className={`${styles.NavIconContMiddle} ${MenuDisplay ? styles.NavIconContMiddleVisible : ''}`}>
                {props.Botons?.map((item, index) => {
                    const isExternal =
                        item.openTarget === 'external' || /^(?:[a-z]+:)?\/\//i.test(item.linkURL);
                    const normalized = item.linkURL.startsWith('/') ? item.linkURL : `/${item.linkURL}`;
                    const href = isExternal ? item.linkURL : i18nHref(normalized);

                    console.log("happening")

                    return (
                        <div className={styles.NavIcon} key={index+'mb'}>
                        <LINK
                            target={isExternal ? "_blank" : "_self"}
                            rel={isExternal ? 'noopener noreferrer' : undefined}
                            className={styles.MenuButtom}
                            href={href}
                        >
                            <FM id={item.FormattedMessage} defaultMessage={item.defaultMessage} />
                        </LINK>
                        </div>
                    );
                })}
            </div>
            <div className={styles.NavIconContStart}>
                {props.SocMed && 
                    props.SocMed.map((socmed, index) => {
                        return(
                            <a className={styles.Footeritem} href={socmed.PUrl} key={index+'sm'} target="_blank" rel="noopener noreferrer">
                                {socmed.PIcon && <IMAGE src={socmed.PIcon} style={{ width: "auto", height: "auto", borderRadius: "7px" }} width={30} height={30} alt={'Social Media'}/>}
                                {socmed.PName && socmed.PName}
                            </a>
                        )
                    })
                }
            </div>
            <div className={styles.NavIconContEnd}>
                {props.DeliveryPlatforms && 
                    props.DeliveryPlatforms.map((plat, index) => {
                        return(
                            <a className={styles.Footeritem} href={plat.PUrl} key={index+'pf'} target="_blank" rel="noopener noreferrer">
                                {plat.PIcon && <IMAGE src={plat.PIcon} style={{ width: "auto", height: "auto", borderRadius: "7px" }} width={30} height={30} alt={'Platforms'}/>}
                                {plat.PName && plat.PName}
                            </a>
                        )
                    })
                }
            </div>
            <ThemeToggle floating />
       </nav>
    );
}