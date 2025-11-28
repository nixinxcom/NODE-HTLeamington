import { ReactNode } from "react";

type PLprops = {
    children : ReactNode
    className? : string;
    overflow? : "x" | "y";
}

export default function PocketList( props : PLprops ) {
    const OFclassN = props.overflow === "x" ? "overflow-x-auto" : props.overflow === "y" ? "overflow-y-auto" : "";

    return (
        <div className={`${OFclassN} ${props.className ?? ""}`.trim()}>
            {props.children}
        </div>
    );
}