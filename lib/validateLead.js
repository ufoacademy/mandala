const PHONE_PATTERN = /^01[0-9]-?\d{3,4}-?\d{4}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLead({ name, age, gender, contact, email, consent, honeypot }) {
  if (honeypot) {
    return { valid: false, errors: ['spam_detected'], name: '', age: '', gender: '', contact: '', email: '' };
  }

  const errors = [];
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedAge = typeof age === 'string' ? age.trim() : '';
  const trimmedGender = typeof gender === 'string' ? gender.trim() : '';
  const trimmedContact = typeof contact === 'string' ? contact.trim() : '';
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';

  if (trimmedName.length < 2 || trimmedName.length > 20) {
    errors.push('invalid_name');
  }
  if (!PHONE_PATTERN.test(trimmedContact)) {
    errors.push('invalid_contact');
  }
  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.push('invalid_email');
  }
  if (!consent) {
    errors.push('consent_required');
  }

  return {
    valid: errors.length === 0,
    errors,
    name: trimmedName,
    age: trimmedAge,
    gender: trimmedGender,
    contact: trimmedContact,
    email: trimmedEmail,
  };
}

module.exports = { validateLead };
