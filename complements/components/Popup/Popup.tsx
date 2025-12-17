import React, { useEffect } from "react";
import styles from "./Popup.module.css";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

interface iPopup{
  Message: string;
}
function FeedbackPopup (props: iPopup){
  return (
    <div className={styles.Popup}>
      <P>{props.Message}</P>
    </div>
  )
}

export default React.memo(FeedbackPopup)