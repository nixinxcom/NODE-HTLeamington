'use client'

import React, { useState, useRef, useEffect  } from 'react';
import { useAppContext } from '@/context/AppContext';
import {IntlProvider, FormattedMessage, FormattedNumber} from 'react-intl';
import FM from "@/complements/i18n/FM";
import SliderCardComp from '@/complements/components/SliderComp/SliderCardComp';
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";
import Image from 'next/image';
import ReactPlayer from 'react-player/lazy'
import styles from './CardElem.module.css';
import { SocialIcon } from 'react-social-icons';

// Interfaz para la dirección en Canadá
interface ICanada {
    country: 'Canada',
    street: string,
    ExtNumber: string,
    Int?: string,
    County: string,
    ZipCode?: string,
    ProvState: string,
}
// Interfaz para las plataformas de entrega
interface IPlatforms {
    platform: 'Uber Eats' | 'DoorDash' | 'Grubhub' | 'SkipTheDishes' | 'Postmates' | 'Instacart' | 'Caviar' | 'Ritual' | 'Seamless' | 'Online Ordering';
    url: string,
}
// Interfaz para la información de contacto
interface IContactInfo {
    address?: ICanada,
    phones?: Array<string>,
    email?: string,
}
interface iGallery{
    images: Array<string>,
    gallerySide: 'left' | 'top' | 'right'| 'bottom',
}
// Interfaz para las propiedades del elemento de la tarjeta
interface iCardElem {
    logo?: string,
    title?: string,
    description?: string,
    keywords?: Array<string>,
    backgroundColor?: string,
    textColor?: string,
    imGallery?: iGallery,
    videoURL?: string,
    price?: number,
    linkURL?: string,
    website?: string,
    socMed?: Array<string>,
    deliveryPlatforms?: IPlatforms[],
    mapIframe?: any, // URL del iframe del mapa
    ContactInfo: IContactInfo,
    UsrSettings: iUserSettings
    BusSettings: iBusinessSettings
}

// Interfaz de caracteristicas contratadas para este anuncio
interface iUserSettings{
    showLogo: boolean,
    showTitle: boolean,
    showPrice: boolean,
    showDescription: boolean,
    showGallery: boolean,
    GallerySize: number,
    showVideo: boolean,
    showPopup: boolean,
    showKeywords: boolean,
    showWebsite?: boolean,
    showSocMed: boolean,
    showPlatforms: boolean,
    showMap: boolean,
    mapType: 'embed' | 'streetview' | 'places' | 'destiny'
    showChats: boolean,
    UserPriority: 1 | 2 | 3 | 4 | 5, // 1= Organic, 2= Keywords, 3= Featured styles, 4= First Positions, 5= Sugestions
}

// Interfaz de caracteristicas de estrategia de NIXIN para este anuncio
interface iBusinessSettings{
    expireDate: Date,
    showFavoriteIcon: boolean,
    MediaWidth: number,
    MediaHeight: number,
    status: 'enabled' | 'disabled' | 'inactive' | 'expired' | 'restricted' | 'blocked'
    paymentModel: 'PRE' | 'PPU' | 'PPE' | 'PRO', //PRE= Membership prepaid, PPU= Pay per Use, PPE= Pay per Event, PRO= Promise to pay
    usersRanking: number,
    businessStrategy: boolean,
}
export default function CardElem(
    {
        logo,
        title,
        description,
        backgroundColor = '#ffffff',
        textColor = '#000000',
        imGallery,
        videoURL,
        price,
        linkURL,
        website,
        socMed,
        deliveryPlatforms,
        mapIframe,
        ContactInfo,
        UsrSettings,
        BusSettings,
    }:iCardElem
){
    
    const [ShowVideo, setShowVideo] = useState(false);
    const [ShowGallery, setShowGallery] = useState(UsrSettings.showGallery);
    const [IsFavorited, setIsFavorited] = useState(false);
    const [FronView, setFronView] = useState(true);
    const [ShowContact, setShowContact] = useState(false);
    const frontRef = useRef<HTMLDivElement>(null);  // Referencia para el FrontContainer
    const [frontViewSize, setFrontViewSize] = useState({ width: 0, height: 0 });
  
  // Obtener el tamaño del FrontContainer cuando se renderiza
    useEffect(() => {
        if (frontRef.current) {
            const { offsetWidth, offsetHeight } = frontRef.current;
            setFrontViewSize({ width: offsetWidth, height: offsetHeight });
        }
    }, []);

    return (
        <>
            {new Date(BusSettings.expireDate).getTime() + 24 * 60 * 60 * 1000 >= new Date().getTime() - 24 * 60 * 60 * 1000 &&
                <div className={styles.AddContainer}>
                    {BusSettings.status != 'enabled' && <div className={styles.StatusDisabled}/>} {/* Bloqueador del anuncio */}
                    <div className={styles.CardContainer}>
                        {FronView ?
                            <div className={styles.FrontContainer} ref={frontRef} style={{backgroundColor: backgroundColor && backgroundColor, color: textColor && textColor}}>
                                {logo && 
                                    (website ? (
                                        <LINK className={styles.Logotype} href={website} passHref target="_blank" rel="noopener noreferrer">
                                            <img 
                                                style={{cursor: 'alias'}} 
                                                src={logo} 
                                                alt="Logotype" 
                                            />
                                        </LINK>
                                    ) : (
                                        <img 
                                            className={styles.Logotype} 
                                            src={logo} 
                                            alt="Logotype" 
                                        />
                                    ))
                                }
                                {videoURL && 
                                    <>
                                        <div className={styles.MediaPlayer}>
                                            <Image fill onClick={()=>setShowVideo(!ShowVideo)} src={ShowVideo ? '/icons/FotosIcon.png' : '/icons/VideoIcon.png' } alt="MediaPlayer"/>
                                        </div>
                                        {ShowVideo ?
                                                <div className={styles.ImgCont} style={{width: BusSettings.MediaWidth, height: BusSettings.MediaHeight}}>
                                                    <div className={styles.blocker} style={{width: BusSettings.MediaWidth, height: BusSettings.MediaHeight}}></div>
                                                    <ReactPlayer className={styles.ImgCont}
                                                        url={videoURL}
                                                        volume={1}
                                                        width= {'max-content'}
                                                        height= {'max-content'}
                                                        controls={false}
                                                        playing={true}
                                                        autoplay={true}
                                                        muted={false}
                                                        loop={true}
                                                    />
                                                </div>
                                            :
                                            (imGallery &&
                                                <div className={styles.ImgCont} style={{width: BusSettings.MediaWidth, height: BusSettings.MediaHeight}}>
                                                    <SliderCardComp
                                                        ImgSeconds={2}
                                                        DispGalleries={{
                                                            display: ShowGallery,
                                                            position: imGallery.gallerySide
                                                        }}
                                                        width={BusSettings.MediaWidth}
                                                        height={BusSettings.MediaHeight}
                                                        /* ⬇️ Ajuste: enviar 'galleries' en lugar de 'images' */
                                                        galleries={[
                                                            {
                                                                title: title,
                                                                shortdesc: description,
                                                                url: linkURL,
                                                                images: imGallery.images,
                                                            },
                                                        ]}
                                                    />
                                                </div>
                                            )
                                        }
                                    </>
                                }
                                {title && <H1 className={styles.Title}><FM id="global.title" defaultMessage="Title"/></H1>}
                                {description && <P className={styles.Details} onClick={()=>setFronView(!FronView)} style={{color: backgroundColor, background:textColor}}><FM id="global.detail" defaultMessage="Detail"/></P>}
                                {price && <SPAN className={styles.Price}><FormattedNumber value={price} style="currency" currency="CAD" /></SPAN>}
                                {<div className={styles.Contact}>
                                    <H1 onClick={()=>setShowContact(!ShowContact)}>
                                        <FM
                                            id="global.contact"
                                            defaultMessage="Contact"
                                        />
                                    </H1>
                                    {ShowContact &&
                                        <div className={styles.ContactInfoContainer} style={{backgroundColor: backgroundColor, color: textColor}}>
                                            {(BusSettings.paymentModel !== 'PPE') && 
                                                <div>
                                                    <div className={styles.Ranking} style={{backgroundColor:`hsl(${(BusSettings.usersRanking*10) * 1.4}, 70%, 35%)`, borderRadius: '100%'}} >
                                                        {<SPAN className={styles.Rank}>{BusSettings.usersRanking}</SPAN>}
                                                        <Image src="/icons/LoadingIcon.png" fill alt="" />
                                                    </div>
                                                    {ContactInfo.email && <P><FM id="global.email" defaultMessage="Email"/>: {ContactInfo.email}</P>}
                                                    {ContactInfo.phones && ContactInfo.phones.map((phone, i) => (
                                                        <P key={i}>Tel_{i+1} : {phone}</P>
                                                    ))}
                                                    {ContactInfo.address && (
                                                        <H4 className={styles.Address}>
                                                            {ContactInfo.address.ExtNumber + (ContactInfo.address.Int && ' (int.' + ContactInfo.address.Int + ')') + ' ' + ContactInfo.address.street + ', ' + ContactInfo.address.County + ', ' + ContactInfo.address.ProvState + ', ' + ContactInfo.address.country + (ContactInfo.address.ZipCode && ', ' + ContactInfo.address.ZipCode)}
                                                        </H4>
                                                    )}
                                                </div>
                                            }
                                            <hr />
                                            <div className={styles.Flex} ><FM id="global.name" defaultMessage="Name"/><INPUT type='text' required/></div>
                                            <div className={styles.Flex} ><FM id="global.phone" defaultMessage="Phone"/><INPUT type='number' required/></div>
                                            <div className={styles.Flex} ><FM id="global.email" defaultMessage="Email"/><INPUT type='email' required/></div>
                                            <BUTTON><FM id="global.submit" defaultMessage="Submit"/></BUTTON>
                                        </div>
                                    }
                                </div>}
                                <div className={styles.Carrusel} onClick={()=>{setShowGallery(!ShowGallery)}}>
                                    <Image src={'/icons/MaximizeIcon.png'} fill alt=""/>
                                </div>
                                {(UsrSettings.showSocMed && socMed) &&
                                    <div className={styles.SocialMediaContainer}>
                                        {socMed.map((SM:any, i:number)=>{return (<SocialIcon key={i} style={{ width: '28px', height:'28px', margin: '2px'}} rel="noopener noreferrer" target="_blank" url={SM} />)})}
                                    </div>
                                }
                                {(UsrSettings.showPlatforms && deliveryPlatforms) &&
                                    <div className={styles.PlatformsContainer}>
                                        {deliveryPlatforms.map((DP: any, i: number) => {
                                            let platformIcon = '';
                                            switch(DP.platform) {
                                                case 'Uber Eats':
                                                    platformIcon = '/icons/UberEats.png';
                                                    break;
                                                case 'DoorDash':
                                                    platformIcon = '/icons/DoorDashIcon.png';
                                                    break;
                                                case 'SkipTheDishes':
                                                    platformIcon = '/icons/SkipTheDishes.jpg';
                                                    break;
                                                case 'Instacart':
                                                    platformIcon = '/icons/Instacart.png';
                                                    break;
                                                default:
                                                    platformIcon = '/icons/DeliveryIcon.png';
                                            }

                                            return (                                            
                                                <a className={styles.DeliveryIcon} key={i} rel="noopener noreferrer" target="_blank" href={DP.url}>
                                                    <Image
                                                        src={platformIcon}
                                                        alt={DP.platform}
                                                        fill
                                                    />
                                                </a>
                                            );
                                        })
                                        }
                                    </div>
                                }
                            </div>
                        :
                            <div className={styles.BackContainer} style={{backgroundColor: backgroundColor && backgroundColor, color: textColor && textColor, width: `${frontViewSize.width}px`, height: `${frontViewSize.height}px`}}>
                                {<div className={styles.Contact}>
                                    <H1 onClick={()=>setShowContact(!ShowContact)}>
                                        <FM
                                            id="global.contact"
                                            defaultMessage="Contact"
                                        />
                                    </H1>
                                    {ShowContact &&
                                        <div className={styles.ContactInfoContainer} style={{backgroundColor: backgroundColor, color: textColor}}>
                                            {(BusSettings.paymentModel !== 'PPE') && 
                                                <div>
                                                    <div className={styles.Ranking} style={{backgroundColor:`hsl(${(BusSettings.usersRanking*10) * 1.4}, 70%, 35%)`, borderRadius: '100%'}} >
                                                        {<SPAN className={styles.Rank}>{BusSettings.usersRanking}</SPAN>}
                                                        <Image src="/icons/LoadingIcon.png" fill alt="" />
                                                    </div>
                                                    {ContactInfo.email && (
                                                        <P>
                                                            <FM id="global.email" defaultMessage="Email" />: {ContactInfo.email}
                                                        </P>
                                                    )}

                                                    {Array.isArray(ContactInfo.phones) &&
                                                        ContactInfo.phones.map((phone, i) => (
                                                            <P key={i}>Tel_{i + 1} : {phone}</P>
                                                    ))}

                                                    {ContactInfo.address && (
                                                        <H4 className={styles.Address}>
                                                            {ContactInfo.address.ExtNumber}
                                                            {ContactInfo.address.Int ? ` (int. ${ContactInfo.address.Int})` : ""}{" "}
                                                            {ContactInfo.address.street}, {ContactInfo.address.County},{" "}
                                                            {ContactInfo.address.ProvState}, {ContactInfo.address.country}
                                                            {ContactInfo.address.ZipCode ? `, ${ContactInfo.address.ZipCode}` : ""}
                                                        </H4>
                                                    )}
                                                </div>
                                            }
                                            <hr />
                                            <div className={styles.Flex} ><FM id="global.name" defaultMessage="Name"/><INPUT type='text' required/></div>
                                            <div className={styles.Flex} ><FM id="global.phone" defaultMessage="Phone"/><INPUT type='number' required/></div>
                                            <div className={styles.Flex} ><FM id="global.email" defaultMessage="Email"/><INPUT type='email' required/></div>
                                            <BUTTON><FM id="global.submit" defaultMessage="Submit"/></BUTTON>
                                        </div>
                                    }
                                </div>}
                                <div className={styles.Return} onClick={()=>{setFronView(!FronView)}}>
                                    <FM id="global.return" defaultMessage="Return"/>
                                </div>
                                {description && 
                                    <P className={styles.Description} style={{width: `${frontViewSize.width}px`}}>{description + description + description + description}</P>
                                }
                                {linkURL &&
                                    <a className={styles.Link} href={linkURL}  target="_blank" rel="noopener noreferrer">
                                        <IMAGE src="/icons/LinkURL.png" fill alt=""/>
                                    </a>
                                }
                                {BusSettings.showFavoriteIcon &&
                                    <div>
                                        <img className={styles.StickyIcon} onClick={()=>(setIsFavorited(!IsFavorited))} src={IsFavorited ? '/icons/RestIcon.png' : '/icons/AddIcon.png'} alt="Sticky" style={{objectFit: 'contain'}}/>
                                    </div>
                                }
                                {mapIframe &&
                                    <div className={styles.MapContainer}>
                                        {mapIframe}
                                    </div> 
                                }
                            </div>
                        }
                    </div>
                    <div className={styles.ScreenPopupContainer}>

                    </div>
                </div>
            }
        </>
    );
};