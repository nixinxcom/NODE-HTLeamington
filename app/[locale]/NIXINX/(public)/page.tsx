import styles from "./page.module.css";

export default function NixinxComPage() {
  return (
    <main className={styles.wrapper}>
      <span className={styles.badge}>NIXINX.com</span>
      <h1 className={styles.title}>Instancia Comercial</h1>
      <p className={styles.text}>
        Estás en la capa comercial de NIXINX.
        Aquí viven las páginas, acuerdos y comunicación para clientes,
        separada de la infraestructura nativa (nixinx.org) y de los tenants.
      </p>
    </main>
  );
}
