const PHONE_PATTERN = /^01[0-9]-?\d{3,4}-?\d{4}$/;

function validateLead({ name, contact, honeypot }) {
  if (honeypot) {
    return { valid: false, errors: ['spam_detected'], name: '', contact: '' };
  }

  const errors = [];
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedContact = typeof contact === 'string' ? contact.trim() : '';

  if (trimmedName.length < 2 || trimmedName.length > 20) {
    errors.push('invalid_name');
  }
  if (!PHONE_PATTERN.test(trimmedContact)) {
    errors.push('invalid_contact');
  }

  return {
    valid: errors.length === 0,
    errors,
    name: trimmedName,
    contact: trimmedContact,
  };
}

module.exports = { validateLead };
