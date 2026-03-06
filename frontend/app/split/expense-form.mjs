export function defaultExpenseSelection(members) {
  if (!Array.isArray(members) || members.length === 0) {
    return { paidById: "", splitAmongIds: [] };
  }
  return {
    paidById: members[0].id,
    splitAmongIds: members.map((member) => member.id),
  };
}

export function createExpensePayload({
  members,
  title,
  amount,
  paidById,
  splitAmongIds,
  category,
  date,
  notes,
}) {
  const paidByMember = members.find((member) => member.id === paidById);
  if (!paidByMember) {
    throw new Error("Zahlende Person ungültig.");
  }

  const splitMembers = splitAmongIds
    .map((memberId) => members.find((member) => member.id === memberId))
    .filter(Boolean);
  if (splitMembers.length !== splitAmongIds.length) {
    throw new Error("Aufteilung enthält unbekannte Personen.");
  }

  return {
    title,
    amount,
    paid_by: paidByMember.name,
    paid_by_member_id: paidByMember.id,
    split_among: splitMembers.map((member) => member.name),
    split_among_member_ids: splitMembers.map((member) => member.id),
    category,
    date,
    notes,
  };
}
