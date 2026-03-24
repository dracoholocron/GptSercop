const FORM_CONFIG = {
  requiredFields: ['formCode', 'formTitle', 'formEntity', 'formAmount'],
  errorKeys: {
    codeRequired: 'codeRequired',
    titleRequired: 'titleRequired',
    entityRequired: 'entityRequired',
    amountInvalid: 'amountInvalid'
  },
  messageKeys: {
    draftSaved: 'draftSaved',
    submitted: 'submitted'
  }
};

module.exports = { FORM_CONFIG };
