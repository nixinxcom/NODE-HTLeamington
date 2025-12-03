"use client"
/*Modulos*/
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
/*Estilos*/
import styles from './SliderCardComp.module.css'
import { FormattedMessage, useIntl } from "react-intl";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

interface IGallery{
    images: string[]
    title?: string
    shortdesc?: string
    url?: string
}

interface IDisplay{
    display: boolean,
    position: 'top' | 'bottom' | 'left' | 'right',
}

interface ISlideGallery{
    ImgSeconds: number,
    DispGalleries: IDisplay,
    classNames?: string,
    GalleryID?: string,
    styles?: any,
    width:number,
    height:number,
    galleries: IGallery[]
}

function SliderCardComp(props:ISlideGallery) {
    const [ImgCounter, setImgCounter] = useState<number>(0)
    const [GalCounter, setGalCounter] = useState<number>(0)
    const [TotImgs, setTotImgs] = useState<number>(props.galleries[GalCounter].images.length)
    const [ShowGal, setShowGal] = useState<boolean>()

    return (
        <>
            <div className={styles.SlidCardContainer} id={(props.GalleryID)}
                style={{
                    width:(props.DispGalleries.position == 'top' || props.DispGalleries.position =='bottom') ? props.width : props.width*1.3+14,
                    height:(props.DispGalleries.position == 'top' || props.DispGalleries.position =='bottom') ? props.height*1.3+14 : props.height,
                }}
                    >
                <div className={(styles.SliderCardLink)} style={{width:props.width, height:props.height}}>
                    {props.galleries[GalCounter].title && <P className={styles.CardTitle}>{props.galleries[GalCounter].title}</P>}
                    {props.galleries[GalCounter].url && <a href={`${props.galleries[GalCounter].url}`} target="_black" rel="noreferrer noopener" className={styles.CardUrl}>&#128279;</a>}
                    {TotImgs>1 && 
                        <a className={styles.PrvImgSlideCard} 
                            onClick={() => setImgCounter(ImgCounter <= 0 ? TotImgs - 1 : ImgCounter - 1)}
                        >«</a>
                    }
                    {props.galleries.length>1 && !props.DispGalleries.display && 
                        <Image className={styles.MoreGalleries} src={'/Icons/AddIcon.png'} width={50} height={50} style={{objectFit: 'contain'}} sizes='(max-width: 768px) 7vw, (max-width: 1200px) 7vw, 80px' alt="MoreGalleryes"
                            onClick={()=>setShowGal(!ShowGal)}
                        />
                    }
                    <Image className={styles.SlideImage} src={props.galleries[GalCounter].images[ImgCounter]} fill style={{objectFit: 'contain'}} sizes='(max-width: 768px) 70vw, (max-width: 1200px) 70vw, 800px' alt="SliderComp"
                        onClick={() => setImgCounter(ImgCounter >= TotImgs - 1 ? 0 : ImgCounter + 1)}
                    />
                    {TotImgs>1 &&
                        <a className={styles.NxtImgSlideCard}
                            onClick={() => setImgCounter(ImgCounter >= TotImgs - 1 ? 0 : ImgCounter + 1)}
                        >»</a>}
                    {props.galleries[GalCounter].shortdesc && <P className={styles.CardDescription}>{props.galleries[GalCounter].shortdesc}</P>}
                </div>
                {props.galleries.length>1 && (props.DispGalleries.display || ShowGal) &&
                    <div className={styles.GalleriesContainer}
                        style={{
                            flexFlow:(props.DispGalleries.position == 'top' || props.DispGalleries.position =='bottom') ? 'row' : 'column',
                            width:(props.DispGalleries.position == 'top' || props.DispGalleries.position =='bottom') ? props.width : props.width/3 ,
                            height:(props.DispGalleries.position == 'top' || props.DispGalleries.position =='bottom') ? props.height/3 : props.height,
                            gridArea: props.DispGalleries.position,
                            position: (!props.DispGalleries.display && props.galleries.length>1) ? 'absolute': 'relative',
                            zIndex: (!props.DispGalleries.display && props.galleries.length>1) ? 3: 0
                        }}>
                        {props.galleries.map((Gallery, i)=>{
                            return(
                                <div className={styles.SlideImage1} key={i} 
                                    style={{width:(props.width/3.5), height:(props.height/3.5)}}
                                    >
                                    <Image 
                                        onClick={() => {setGalCounter(i), setTotImgs(Gallery.images.length), setImgCounter(0), setShowGal(false)}} 
                                        src={Gallery.images[0]} 
                                        fill
                                        style={{objectFit: 'contain'}}
                                        sizes='(max-width: 768px) 70vw, (max-width: 1200px) 70vw, 800px'
                                        alt="SliderComp" 
                                    />
                                    {/* <img 
                                        onClick={() => {setGalCounter(i), setTotImgs(Gallery.images.length), setImgCounter(0), setShowGal(false)}} 
                                        src={Gallery.images[0]} 
                                        style={{objectFit: 'contain'}}
                                        sizes='(max-width: 768px) 70vw, (max-width: 1200px) 70vw, 800px'
                                        alt="SliderComp" 
                                    /> */}
                                </div>
                            )
                        })}
                    </div>
                }
            </div>
        </>
    );
}

export default React.memo(SliderCardComp)