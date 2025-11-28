import { ReactNode } from "react";

type NBprops = {
    children : ReactNode;
    className? : string;
}

export default function NavBar( props : NBprops ) : ReactNode {
    return (
        <section className={`flex h-96 fixed top-0 right-0 left-0 ${props.className}`.trim()}>
            {props.children}
        </section>
    );
}