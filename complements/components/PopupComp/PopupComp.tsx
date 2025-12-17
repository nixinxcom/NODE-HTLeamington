'use client'

/*Modulos*/
import React, { useState } from 'react'
import ReactPlayer from 'react-player/lazy'
/*Estilos*/
import styles from './PopupComp.module.css'
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

interface IVideo{
    text: string,
    url: string,
    controls: boolean,
    readOnly: boolean,
}

interface IPopUp{
    mainmessage: string,
    description: string,
    LeftAction?: any,
    RightAction?: any,
    video?: IVideo,
    timer?: number,
    setPopUp: any,
}

function PopupComp(props:IPopUp) {
    const [Video, setVideo] = useState<boolean>(true)
    {props.timer && setTimeout(() => props.setPopUp(false), props.timer*1000)}
    return (
        <div className={styles.MsgContainer}>
            <div className={styles.Msg}>
                <H1 className={styles.MainMessage}>{props.mainmessage}</H1>
                <SPAN className={styles.CloseMsg} onClick={()=>props.setPopUp(false)}>X</SPAN>
                <P className={styles.description}>{props.description}</P>
                <div className={styles.opt}>
                    <div className={styles.choseBtn}>
                            {props.LeftAction && props.LeftAction}
                    </div>
                    <div className={styles.choseBtn}>
                            {props.RightAction && props.RightAction}
                    </div>
                </div>
                <br/>
                {props.video && 
                    <a className={styles.PlayerBtn} onClick={() => setVideo(!Video)}>{props.video?.text}</a>}
                {Video && 
                    <div  className={styles.VideoContainer}>
                        {props.video?.readOnly && <div className={styles.blocker}></div>}
                        <ReactPlayer className={styles.Screen}
                            url={props.video?.url}
                            volume={1}
                            width= '100%'
                            height= '100%'
                            controls={props.video?.controls}
                            playing={true}
                            autoPlay={true}
                            muted={false}
                            loop
                            />
                    </div>
                }
            </div>
        </div>
    )
}
export default React.memo(PopupComp)