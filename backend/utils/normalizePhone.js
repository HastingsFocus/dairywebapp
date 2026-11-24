
const normalizeMalawiPhone = (phone) => {
  if (!phone) {
    throw new Error("Phone number is required.");
  }

  let normalized = String(phone).replace(/[\s()-]/g, "");

  if (normalized.startsWith("0")) {
    normalized = `+265${normalized.substring(1)}`;
  } else if (normalized.startsWith("265")) {
    normalized = `+${normalized}`;
  }

  if (!/^\+265\d{9}$/.test(normalized)) {
    throw new Error(
      "Enter a valid Malawi phone number, for example 0991234567."
    );
  }

  return normalized;
};

export default normalizeMalawiPhone;
