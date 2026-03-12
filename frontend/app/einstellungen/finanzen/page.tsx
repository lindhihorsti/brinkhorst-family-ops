import { BtnLink, Page, styles } from "../../lib/ui";

export default function FinanzenSettingsPage() {
  return (
    <Page
      title="Finanzen"
      subtitle="Monatseinkommen pflegst du direkt im Finanzbereich, damit monatliche Schwankungen sauber abgebildet werden."
      right={<BtnLink href="/einstellungen">Zurück</BtnLink>}
      navCurrent="/einstellungen"
    >
      <div style={{ ...styles.card, marginBottom: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>So ist der Bereich aufgebaut</div>
        <div style={{ color: "var(--fg-muted)", fontSize: 14, lineHeight: 1.5 }}>
          Fixkosten bleiben als wiederkehrende Stammdaten erhalten. Einkommen werden pro Monat für Dennis und Julia gepflegt und daraus zum Haushaltseinkommen summiert.
        </div>
      </div>

      <div style={styles.cardSubtle}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Schnellzugriff</div>
        <a href="/finanzen" style={{ ...styles.buttonPrimary, width: "100%" }}>Zu Finanzen</a>
      </div>
    </Page>
  );
}
