"use client";

import { useEffect, useState } from "react";
import { api, type FamilyMember } from "../../lib/api";
import { Avatar, BtnLink, ConfirmModal, Modal, Page, styles } from "../../lib/ui";

const MEMBER_COLORS = ["#e8673a", "#2b7fff", "#7c3aed", "#d97706", "#db2777", "#16a34a", "#0891b2", "#9d174d"];

export default function FamiliePage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberForm, setMemberForm] = useState<{ name: string; initials: string; color: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);

  const loadMembers = async () => {
    setLoading(true);
    try { setMembers(await api.listFamilyMembers()); } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { loadMembers(); }, []);

  const handleSave = async () => {
    if (!memberForm) return;
    setSaving(true);
    try {
      await api.createFamilyMember({
        name: memberForm.name,
        initials: memberForm.initials || memberForm.name.slice(0, 2).toUpperCase(),
        color: memberForm.color,
        dietary_restrictions: [],
        is_active: true,
      });
      setMemberForm(null);
      await loadMembers();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteMemberId) return;
    try { await api.deleteFamilyMember(deleteMemberId); await loadMembers(); } catch { /* ignore */ }
    setDeleteMemberId(null);
  };

  return (
    <Page
      title="Familie"
      subtitle="Mitglieder verwalten"
      right={<BtnLink href="/einstellungen">Zurück</BtnLink>}
      navCurrent="/einstellungen"
    >
      <ConfirmModal
        open={deleteMemberId !== null}
        title="Mitglied entfernen"
        message="Familienmitglied wirklich entfernen?"
        confirmLabel="Entfernen"
        dangerConfirm
        onConfirm={handleDelete}
        onClose={() => setDeleteMemberId(null)}
      />

      <Modal
        open={memberForm !== null}
        title="Familienmitglied hinzufügen"
        onClose={() => setMemberForm(null)}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...styles.button, flex: 1 }} onClick={() => setMemberForm(null)}>Abbrechen</button>
            <button style={{ ...styles.buttonPrimary, flex: 1 }} onClick={handleSave} disabled={saving || !memberForm?.name}>
              {saving ? "Speichere…" : "Hinzufügen"}
            </button>
          </div>
        }
      >
        {memberForm && (
          <div style={styles.col}>
            <label style={styles.label}>Name</label>
            <input style={styles.input} value={memberForm.name}
              onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} placeholder="z.B. Anna" />
            <label style={styles.label}>Kürzel (max 2 Zeichen)</label>
            <input style={styles.input} value={memberForm.initials} maxLength={2}
              onChange={(e) => setMemberForm({ ...memberForm, initials: e.target.value.slice(0, 2).toUpperCase() })}
              placeholder="z.B. AN" />
            <label style={styles.label}>Farbe</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {MEMBER_COLORS.map((c) => (
                <button key={c} onClick={() => setMemberForm({ ...memberForm, color: c })}
                  style={{
                    width: 32, height: 32, borderRadius: 999, background: c, cursor: "pointer",
                    border: memberForm.color === c ? "3px solid var(--fg)" : "2px solid transparent",
                  }} />
              ))}
            </div>
          </div>
        )}
      </Modal>

      <div style={{ ...styles.card, marginBottom: 16 }}>
        <div style={{ ...styles.rowBetween, marginBottom: loading || members.length > 0 ? 12 : 0 }}>
          <span style={{ fontWeight: 700 }}>
            {loading ? "Lade…" : `${members.length} Mitglied${members.length !== 1 ? "er" : ""}`}
          </span>
          <button style={styles.button}
            onClick={() => setMemberForm({ name: "", initials: "", color: MEMBER_COLORS[0] })}>
            + Hinzufügen
          </button>
        </div>

        {!loading && members.length === 0 && (
          <p style={{ ...styles.small, margin: 0 }}>Noch keine Mitglieder angelegt.</p>
        )}

        {members.map((m) => (
          <div key={m.id} style={{ ...styles.rowBetween, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
            <div style={styles.row}>
              <Avatar initials={m.initials} color={m.color} size={36} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                {m.dietary_restrictions.length > 0 && (
                  <div style={styles.small}>{m.dietary_restrictions.join(", ")}</div>
                )}
              </div>
            </div>
            <button style={{ ...styles.button, padding: "4px 10px", fontSize: 13 }}
              onClick={() => setDeleteMemberId(m.id)}>✕</button>
          </div>
        ))}
      </div>
    </Page>
  );
}
