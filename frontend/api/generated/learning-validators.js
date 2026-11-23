// Generated from backend/openapi/openapi.json. Do not edit.
'use strict';
exports.isGetLearningCatalogueResponse = validate22;
const schema7 = {
  properties: {
    defaultLevel: { allOf: [{ $ref: '#/components/schemas/VocabularyLevel' }] },
    lessons: {
      items: { $ref: '#/components/schemas/LearningLessonSummary' },
      type: 'array',
    },
    supportedLevels: {
      items: { $ref: '#/components/schemas/VocabularyLevel' },
      type: 'array',
    },
    topic: {
      oneOf: [
        { $ref: '#/components/schemas/LearningEntry' },
        { enum: [null], nullable: true, type: 'object' },
      ],
    },
    topics: {
      items: { $ref: '#/components/schemas/LearningEntry' },
      type: 'array',
    },
  },
  required: ['supportedLevels', 'defaultLevel', 'topic', 'topics', 'lessons'],
  type: 'object',
};
const schema8 = { enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], type: 'string' };

function validate23(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (typeof data !== 'string') {
    validate23.errors = [
      {
        instancePath,
        schemaPath: '#/type',
        keyword: 'type',
        params: { type: 'string' },
        message: 'must be string',
      },
    ];
    return false;
  }
  if (!(
    data === 'A1' ||
    data === 'A2' ||
    data === 'B1' ||
    data === 'B2' ||
    data === 'C1' ||
    data === 'C2'
  )) {
    validate23.errors = [
      {
        instancePath,
        schemaPath: '#/enum',
        keyword: 'enum',
        params: { allowedValues: schema8.enum },
        message: 'must be equal to one of the allowed values',
      },
    ];
    return false;
  }
  validate23.errors = vErrors;
  return errors === 0;
}

const schema9 = {
  properties: {
    availableLevels: {
      items: { $ref: '#/components/schemas/VocabularyLevel' },
      type: 'array',
    },
    coverImageUrl: {
      description: 'API-relative URL of the cover, or null if unavailable.',
      nullable: true,
      pattern: '^/learning/media\\?key=\\S+$',
      type: 'string',
    },
    description: { type: 'string' },
    slug: { type: 'string' },
    thumbnailUrl: {
      nullable: true,
      pattern: '^/learning/media\\?key=\\S+$',
      type: 'string',
    },
    title: { type: 'string' },
  },
  required: [
    'slug',
    'coverImageUrl',
    'title',
    'description',
    'availableLevels',
    'thumbnailUrl',
  ],
  type: 'object',
};
const pattern0 = new RegExp('^/learning/media\\?key=\\S+$', 'u');

function validate25(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.slug === undefined && (missing0 = 'slug')) ||
        (data.coverImageUrl === undefined && (missing0 = 'coverImageUrl')) ||
        (data.title === undefined && (missing0 = 'title')) ||
        (data.description === undefined && (missing0 = 'description')) ||
        (data.availableLevels === undefined &&
          (missing0 = 'availableLevels')) ||
        (data.thumbnailUrl === undefined && (missing0 = 'thumbnailUrl'))
      ) {
        validate25.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.availableLevels !== undefined) {
          let data0 = data.availableLevels;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (Array.isArray(data0)) {
              var valid1 = true;
              const len0 = data0.length;
              for (let i0 = 0; i0 < len0; i0++) {
                const _errs3 = errors;
                if (
                  !validate23(data0[i0], {
                    instancePath: instancePath + '/availableLevels/' + i0,
                    parentData: data0,
                    parentDataProperty: i0,
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate23.errors
                      : vErrors.concat(validate23.errors);
                  errors = vErrors.length;
                }
                var valid1 = _errs3 === errors;
                if (!valid1) {
                  break;
                }
              }
            } else {
              validate25.errors = [
                {
                  instancePath: instancePath + '/availableLevels',
                  schemaPath: '#/properties/availableLevels/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                },
              ];
              return false;
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.coverImageUrl !== undefined) {
            let data2 = data.coverImageUrl;
            const _errs4 = errors;
            if (typeof data2 !== 'string' && data2 !== null) {
              validate25.errors = [
                {
                  instancePath: instancePath + '/coverImageUrl',
                  schemaPath: '#/properties/coverImageUrl/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            if (errors === _errs4) {
              if (typeof data2 === 'string') {
                if (!pattern0.test(data2)) {
                  validate25.errors = [
                    {
                      instancePath: instancePath + '/coverImageUrl',
                      schemaPath: '#/properties/coverImageUrl/pattern',
                      keyword: 'pattern',
                      params: { pattern: '^/learning/media\\?key=\\S+$' },
                      message:
                        'must match pattern "' +
                        '^/learning/media\\?key=\\S+$' +
                        '"',
                    },
                  ];
                  return false;
                }
              }
            }
            var valid0 = _errs4 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.description !== undefined) {
              const _errs7 = errors;
              if (typeof data.description !== 'string') {
                validate25.errors = [
                  {
                    instancePath: instancePath + '/description',
                    schemaPath: '#/properties/description/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
              var valid0 = _errs7 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.slug !== undefined) {
                const _errs9 = errors;
                if (typeof data.slug !== 'string') {
                  validate25.errors = [
                    {
                      instancePath: instancePath + '/slug',
                      schemaPath: '#/properties/slug/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
                var valid0 = _errs9 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.thumbnailUrl !== undefined) {
                  let data5 = data.thumbnailUrl;
                  const _errs11 = errors;
                  if (typeof data5 !== 'string' && data5 !== null) {
                    validate25.errors = [
                      {
                        instancePath: instancePath + '/thumbnailUrl',
                        schemaPath: '#/properties/thumbnailUrl/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                  if (errors === _errs11) {
                    if (typeof data5 === 'string') {
                      if (!pattern0.test(data5)) {
                        validate25.errors = [
                          {
                            instancePath: instancePath + '/thumbnailUrl',
                            schemaPath: '#/properties/thumbnailUrl/pattern',
                            keyword: 'pattern',
                            params: { pattern: '^/learning/media\\?key=\\S+$' },
                            message:
                              'must match pattern "' +
                              '^/learning/media\\?key=\\S+$' +
                              '"',
                          },
                        ];
                        return false;
                      }
                    }
                  }
                  var valid0 = _errs11 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.title !== undefined) {
                    const _errs14 = errors;
                    if (typeof data.title !== 'string') {
                      validate25.errors = [
                        {
                          instancePath: instancePath + '/title',
                          schemaPath: '#/properties/title/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ];
                      return false;
                    }
                    var valid0 = _errs14 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate25.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate25.errors = vErrors;
  return errors === 0;
}

const schema10 = {
  properties: {
    availableLevels: {
      items: { $ref: '#/components/schemas/VocabularyLevel' },
      type: 'array',
    },
    coverImageUrl: {
      description: 'API-relative URL of the cover, or null if unavailable.',
      nullable: true,
      pattern: '^/learning/media\\?key=\\S+$',
      type: 'string',
    },
    description: { type: 'string' },
    slug: { type: 'string' },
    title: { type: 'string' },
  },
  required: [
    'slug',
    'coverImageUrl',
    'title',
    'description',
    'availableLevels',
  ],
  type: 'object',
};

function validate29(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.slug === undefined && (missing0 = 'slug')) ||
        (data.coverImageUrl === undefined && (missing0 = 'coverImageUrl')) ||
        (data.title === undefined && (missing0 = 'title')) ||
        (data.description === undefined && (missing0 = 'description')) ||
        (data.availableLevels === undefined && (missing0 = 'availableLevels'))
      ) {
        validate29.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.availableLevels !== undefined) {
          let data0 = data.availableLevels;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (Array.isArray(data0)) {
              var valid1 = true;
              const len0 = data0.length;
              for (let i0 = 0; i0 < len0; i0++) {
                const _errs3 = errors;
                if (
                  !validate23(data0[i0], {
                    instancePath: instancePath + '/availableLevels/' + i0,
                    parentData: data0,
                    parentDataProperty: i0,
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate23.errors
                      : vErrors.concat(validate23.errors);
                  errors = vErrors.length;
                }
                var valid1 = _errs3 === errors;
                if (!valid1) {
                  break;
                }
              }
            } else {
              validate29.errors = [
                {
                  instancePath: instancePath + '/availableLevels',
                  schemaPath: '#/properties/availableLevels/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                },
              ];
              return false;
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.coverImageUrl !== undefined) {
            let data2 = data.coverImageUrl;
            const _errs4 = errors;
            if (typeof data2 !== 'string' && data2 !== null) {
              validate29.errors = [
                {
                  instancePath: instancePath + '/coverImageUrl',
                  schemaPath: '#/properties/coverImageUrl/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            if (errors === _errs4) {
              if (typeof data2 === 'string') {
                if (!pattern0.test(data2)) {
                  validate29.errors = [
                    {
                      instancePath: instancePath + '/coverImageUrl',
                      schemaPath: '#/properties/coverImageUrl/pattern',
                      keyword: 'pattern',
                      params: { pattern: '^/learning/media\\?key=\\S+$' },
                      message:
                        'must match pattern "' +
                        '^/learning/media\\?key=\\S+$' +
                        '"',
                    },
                  ];
                  return false;
                }
              }
            }
            var valid0 = _errs4 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.description !== undefined) {
              const _errs7 = errors;
              if (typeof data.description !== 'string') {
                validate29.errors = [
                  {
                    instancePath: instancePath + '/description',
                    schemaPath: '#/properties/description/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
              var valid0 = _errs7 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.slug !== undefined) {
                const _errs9 = errors;
                if (typeof data.slug !== 'string') {
                  validate29.errors = [
                    {
                      instancePath: instancePath + '/slug',
                      schemaPath: '#/properties/slug/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
                var valid0 = _errs9 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.title !== undefined) {
                  const _errs11 = errors;
                  if (typeof data.title !== 'string') {
                    validate29.errors = [
                      {
                        instancePath: instancePath + '/title',
                        schemaPath: '#/properties/title/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs11 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate29.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate29.errors = vErrors;
  return errors === 0;
}

function validate22(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.supportedLevels === undefined &&
          (missing0 = 'supportedLevels')) ||
        (data.defaultLevel === undefined && (missing0 = 'defaultLevel')) ||
        (data.topic === undefined && (missing0 = 'topic')) ||
        (data.topics === undefined && (missing0 = 'topics')) ||
        (data.lessons === undefined && (missing0 = 'lessons'))
      ) {
        validate22.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.defaultLevel !== undefined) {
          const _errs1 = errors;
          if (
            !validate23(data.defaultLevel, {
              instancePath: instancePath + '/defaultLevel',
              parentData: data,
              parentDataProperty: 'defaultLevel',
              rootData,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate23.errors
                : vErrors.concat(validate23.errors);
            errors = vErrors.length;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.lessons !== undefined) {
            let data1 = data.lessons;
            const _errs3 = errors;
            if (errors === _errs3) {
              if (Array.isArray(data1)) {
                var valid2 = true;
                const len0 = data1.length;
                for (let i0 = 0; i0 < len0; i0++) {
                  const _errs5 = errors;
                  if (
                    !validate25(data1[i0], {
                      instancePath: instancePath + '/lessons/' + i0,
                      parentData: data1,
                      parentDataProperty: i0,
                      rootData,
                    })
                  ) {
                    vErrors =
                      vErrors === null
                        ? validate25.errors
                        : vErrors.concat(validate25.errors);
                    errors = vErrors.length;
                  }
                  var valid2 = _errs5 === errors;
                  if (!valid2) {
                    break;
                  }
                }
              } else {
                validate22.errors = [
                  {
                    instancePath: instancePath + '/lessons',
                    schemaPath: '#/properties/lessons/type',
                    keyword: 'type',
                    params: { type: 'array' },
                    message: 'must be array',
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.supportedLevels !== undefined) {
              let data3 = data.supportedLevels;
              const _errs6 = errors;
              if (errors === _errs6) {
                if (Array.isArray(data3)) {
                  var valid3 = true;
                  const len1 = data3.length;
                  for (let i1 = 0; i1 < len1; i1++) {
                    const _errs8 = errors;
                    if (
                      !validate23(data3[i1], {
                        instancePath: instancePath + '/supportedLevels/' + i1,
                        parentData: data3,
                        parentDataProperty: i1,
                        rootData,
                      })
                    ) {
                      vErrors =
                        vErrors === null
                          ? validate23.errors
                          : vErrors.concat(validate23.errors);
                      errors = vErrors.length;
                    }
                    var valid3 = _errs8 === errors;
                    if (!valid3) {
                      break;
                    }
                  }
                } else {
                  validate22.errors = [
                    {
                      instancePath: instancePath + '/supportedLevels',
                      schemaPath: '#/properties/supportedLevels/type',
                      keyword: 'type',
                      params: { type: 'array' },
                      message: 'must be array',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs6 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.topic !== undefined) {
                let data5 = data.topic;
                const _errs9 = errors;
                const _errs10 = errors;
                let valid4 = false;
                let passing0 = null;
                const _errs11 = errors;
                if (
                  !validate29(data5, {
                    instancePath: instancePath + '/topic',
                    parentData: data,
                    parentDataProperty: 'topic',
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate29.errors
                      : vErrors.concat(validate29.errors);
                  errors = vErrors.length;
                }
                var _valid0 = _errs11 === errors;
                if (_valid0) {
                  valid4 = true;
                  passing0 = 0;
                }
                const _errs12 = errors;
                if (
                  !(
                    data5 &&
                    typeof data5 == 'object' &&
                    !Array.isArray(data5)
                  ) &&
                  data5 !== null
                ) {
                  const err0 = {
                    instancePath: instancePath + '/topic',
                    schemaPath: '#/properties/topic/oneOf/1/type',
                    keyword: 'type',
                    params: { type: 'object' },
                    message: 'must be object',
                  };
                  if (vErrors === null) {
                    vErrors = [err0];
                  } else {
                    vErrors.push(err0);
                  }
                  errors++;
                }
                if (!(data5 === null)) {
                  const err1 = {
                    instancePath: instancePath + '/topic',
                    schemaPath: '#/properties/topic/oneOf/1/enum',
                    keyword: 'enum',
                    params: {
                      allowedValues: schema7.properties.topic.oneOf[1].enum,
                    },
                    message: 'must be equal to one of the allowed values',
                  };
                  if (vErrors === null) {
                    vErrors = [err1];
                  } else {
                    vErrors.push(err1);
                  }
                  errors++;
                }
                var _valid0 = _errs12 === errors;
                if (_valid0 && valid4) {
                  valid4 = false;
                  passing0 = [passing0, 1];
                } else {
                  if (_valid0) {
                    valid4 = true;
                    passing0 = 1;
                  }
                }
                if (!valid4) {
                  const err2 = {
                    instancePath: instancePath + '/topic',
                    schemaPath: '#/properties/topic/oneOf',
                    keyword: 'oneOf',
                    params: { passingSchemas: passing0 },
                    message: 'must match exactly one schema in oneOf',
                  };
                  if (vErrors === null) {
                    vErrors = [err2];
                  } else {
                    vErrors.push(err2);
                  }
                  errors++;
                  validate22.errors = vErrors;
                  return false;
                } else {
                  errors = _errs10;
                  if (vErrors !== null) {
                    if (_errs10) {
                      vErrors.length = _errs10;
                    } else {
                      vErrors = null;
                    }
                  }
                }
                var valid0 = _errs9 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.topics !== undefined) {
                  let data6 = data.topics;
                  const _errs15 = errors;
                  if (errors === _errs15) {
                    if (Array.isArray(data6)) {
                      var valid5 = true;
                      const len2 = data6.length;
                      for (let i2 = 0; i2 < len2; i2++) {
                        const _errs17 = errors;
                        if (
                          !validate29(data6[i2], {
                            instancePath: instancePath + '/topics/' + i2,
                            parentData: data6,
                            parentDataProperty: i2,
                            rootData,
                          })
                        ) {
                          vErrors =
                            vErrors === null
                              ? validate29.errors
                              : vErrors.concat(validate29.errors);
                          errors = vErrors.length;
                        }
                        var valid5 = _errs17 === errors;
                        if (!valid5) {
                          break;
                        }
                      }
                    } else {
                      validate22.errors = [
                        {
                          instancePath: instancePath + '/topics',
                          schemaPath: '#/properties/topics/type',
                          keyword: 'type',
                          params: { type: 'array' },
                          message: 'must be array',
                        },
                      ];
                      return false;
                    }
                  }
                  var valid0 = _errs15 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate22.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate22.errors = vErrors;
  return errors === 0;
}

exports.isGetLearningLessonResponse = validate33;
const schema11 = {
  properties: {
    availableLevels: {
      items: { $ref: '#/components/schemas/VocabularyLevel' },
      type: 'array',
    },
    coverImageUrl: {
      description: 'API-relative URL of the cover, or null if unavailable.',
      nullable: true,
      pattern: '^/learning/media\\?key=\\S+$',
      type: 'string',
    },
    description: { type: 'string' },
    readingCheckImageUrl: {
      nullable: true,
      pattern: '^/learning/media\\?key=\\S+$',
      type: 'string',
    },
    readingImageUrl: {
      nullable: true,
      pattern: '^/learning/media\\?key=\\S+$',
      type: 'string',
    },
    resultsImageUrl: {
      nullable: true,
      pattern: '^/learning/media\\?key=\\S+$',
      type: 'string',
    },
    slug: { type: 'string' },
    supportedLevels: {
      items: { $ref: '#/components/schemas/VocabularyLevel' },
      type: 'array',
    },
    title: { type: 'string' },
    topicSlug: { type: 'string' },
    variant: {
      description:
        'Null when this lesson has no published variant for the requested English level. No level fallback.',
      oneOf: [
        { $ref: '#/components/schemas/LearningVariant' },
        { enum: [null], nullable: true, type: 'object' },
      ],
    },
  },
  required: [
    'slug',
    'coverImageUrl',
    'title',
    'description',
    'availableLevels',
    'topicSlug',
    'readingImageUrl',
    'readingCheckImageUrl',
    'resultsImageUrl',
    'supportedLevels',
    'variant',
  ],
  type: 'object',
};
const schema12 = {
  properties: {
    level: { allOf: [{ $ref: '#/components/schemas/VocabularyLevel' }] },
    questions: {
      items: { $ref: '#/components/schemas/LearningReadingQuestion' },
      minItems: 1,
      type: 'array',
    },
    readingParagraphs: {
      items: { type: 'string' },
      minItems: 1,
      type: 'array',
    },
    readingTitle: { type: 'string' },
    vocabulary: { $ref: '#/components/schemas/LearningVocabulary' },
  },
  required: [
    'level',
    'vocabulary',
    'readingTitle',
    'readingParagraphs',
    'questions',
  ],
  type: 'object',
};
const schema13 = {
  properties: {
    id: { type: 'string' },
    options: {
      items: { $ref: '#/components/schemas/LearningReadingOption' },
      type: 'array',
    },
    prompt: { type: 'string' },
  },
  required: ['id', 'prompt', 'options'],
  type: 'object',
};
const schema14 = {
  properties: { id: { type: 'string' }, text: { type: 'string' } },
  required: ['id', 'text'],
  type: 'object',
};

function validate39(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.id === undefined && (missing0 = 'id')) ||
        (data.text === undefined && (missing0 = 'text'))
      ) {
        validate39.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.id !== undefined) {
          const _errs1 = errors;
          if (typeof data.id !== 'string') {
            validate39.errors = [
              {
                instancePath: instancePath + '/id',
                schemaPath: '#/properties/id/type',
                keyword: 'type',
                params: { type: 'string' },
                message: 'must be string',
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.text !== undefined) {
            const _errs3 = errors;
            if (typeof data.text !== 'string') {
              validate39.errors = [
                {
                  instancePath: instancePath + '/text',
                  schemaPath: '#/properties/text/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
        }
      }
    } else {
      validate39.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate39.errors = vErrors;
  return errors === 0;
}

function validate38(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.id === undefined && (missing0 = 'id')) ||
        (data.prompt === undefined && (missing0 = 'prompt')) ||
        (data.options === undefined && (missing0 = 'options'))
      ) {
        validate38.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.id !== undefined) {
          const _errs1 = errors;
          if (typeof data.id !== 'string') {
            validate38.errors = [
              {
                instancePath: instancePath + '/id',
                schemaPath: '#/properties/id/type',
                keyword: 'type',
                params: { type: 'string' },
                message: 'must be string',
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.options !== undefined) {
            let data1 = data.options;
            const _errs3 = errors;
            if (errors === _errs3) {
              if (Array.isArray(data1)) {
                var valid1 = true;
                const len0 = data1.length;
                for (let i0 = 0; i0 < len0; i0++) {
                  const _errs5 = errors;
                  if (
                    !validate39(data1[i0], {
                      instancePath: instancePath + '/options/' + i0,
                      parentData: data1,
                      parentDataProperty: i0,
                      rootData,
                    })
                  ) {
                    vErrors =
                      vErrors === null
                        ? validate39.errors
                        : vErrors.concat(validate39.errors);
                    errors = vErrors.length;
                  }
                  var valid1 = _errs5 === errors;
                  if (!valid1) {
                    break;
                  }
                }
              } else {
                validate38.errors = [
                  {
                    instancePath: instancePath + '/options',
                    schemaPath: '#/properties/options/type',
                    keyword: 'type',
                    params: { type: 'array' },
                    message: 'must be array',
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.prompt !== undefined) {
              const _errs6 = errors;
              if (typeof data.prompt !== 'string') {
                validate38.errors = [
                  {
                    instancePath: instancePath + '/prompt',
                    schemaPath: '#/properties/prompt/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
              var valid0 = _errs6 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate38.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate38.errors = vErrors;
  return errors === 0;
}

const schema15 = {
  properties: {
    questions: {
      items: { $ref: '#/components/schemas/VocabularyPracticeQuestion' },
      type: 'array',
    },
    words: {
      items: { $ref: '#/components/schemas/VocabularyLessonWord' },
      type: 'array',
    },
  },
  required: ['words', 'questions'],
  type: 'object',
};
const schema16 = {
  properties: {
    id: { type: 'string' },
    kind: { allOf: [{ $ref: '#/components/schemas/VocabularyExerciseKind' }] },
    options: {
      items: { $ref: '#/components/schemas/VocabularyPracticeOption' },
      minItems: 2,
      type: 'array',
    },
    prompt: {
      description:
        'English prompt for word/picture or device speech; null for a sentence gap. No answer identifier.',
      nullable: true,
      type: 'string',
    },
    sentenceAfter: { nullable: true, type: 'string' },
    sentenceBefore: { nullable: true, type: 'string' },
  },
  required: [
    'id',
    'kind',
    'prompt',
    'sentenceBefore',
    'sentenceAfter',
    'options',
  ],
  type: 'object',
};
const schema17 = {
  enum: ['word_to_picture', 'audio_to_picture', 'sentence_gap'],
  type: 'string',
};

function validate44(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (typeof data !== 'string') {
    validate44.errors = [
      {
        instancePath,
        schemaPath: '#/type',
        keyword: 'type',
        params: { type: 'string' },
        message: 'must be string',
      },
    ];
    return false;
  }
  if (!(
    data === 'word_to_picture' ||
    data === 'audio_to_picture' ||
    data === 'sentence_gap'
  )) {
    validate44.errors = [
      {
        instancePath,
        schemaPath: '#/enum',
        keyword: 'enum',
        params: { allowedValues: schema17.enum },
        message: 'must be equal to one of the allowed values',
      },
    ];
    return false;
  }
  validate44.errors = vErrors;
  return errors === 0;
}

const schema18 = {
  properties: {
    id: { type: 'string' },
    imageKey: { type: 'string' },
    imageUrl: {
      nullable: true,
      pattern: '^/learning/media\\?key=\\S+$',
      type: 'string',
    },
    word: { type: 'string' },
  },
  required: ['id', 'word', 'imageKey', 'imageUrl'],
  type: 'object',
};

function validate46(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.id === undefined && (missing0 = 'id')) ||
        (data.word === undefined && (missing0 = 'word')) ||
        (data.imageKey === undefined && (missing0 = 'imageKey')) ||
        (data.imageUrl === undefined && (missing0 = 'imageUrl'))
      ) {
        validate46.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.id !== undefined) {
          const _errs1 = errors;
          if (typeof data.id !== 'string') {
            validate46.errors = [
              {
                instancePath: instancePath + '/id',
                schemaPath: '#/properties/id/type',
                keyword: 'type',
                params: { type: 'string' },
                message: 'must be string',
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.imageKey !== undefined) {
            const _errs3 = errors;
            if (typeof data.imageKey !== 'string') {
              validate46.errors = [
                {
                  instancePath: instancePath + '/imageKey',
                  schemaPath: '#/properties/imageKey/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.imageUrl !== undefined) {
              let data2 = data.imageUrl;
              const _errs5 = errors;
              if (typeof data2 !== 'string' && data2 !== null) {
                validate46.errors = [
                  {
                    instancePath: instancePath + '/imageUrl',
                    schemaPath: '#/properties/imageUrl/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
              if (errors === _errs5) {
                if (typeof data2 === 'string') {
                  if (!pattern0.test(data2)) {
                    validate46.errors = [
                      {
                        instancePath: instancePath + '/imageUrl',
                        schemaPath: '#/properties/imageUrl/pattern',
                        keyword: 'pattern',
                        params: { pattern: '^/learning/media\\?key=\\S+$' },
                        message:
                          'must match pattern "' +
                          '^/learning/media\\?key=\\S+$' +
                          '"',
                      },
                    ];
                    return false;
                  }
                }
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.word !== undefined) {
                const _errs8 = errors;
                if (typeof data.word !== 'string') {
                  validate46.errors = [
                    {
                      instancePath: instancePath + '/word',
                      schemaPath: '#/properties/word/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
                var valid0 = _errs8 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      }
    } else {
      validate46.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate46.errors = vErrors;
  return errors === 0;
}

function validate43(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.id === undefined && (missing0 = 'id')) ||
        (data.kind === undefined && (missing0 = 'kind')) ||
        (data.prompt === undefined && (missing0 = 'prompt')) ||
        (data.sentenceBefore === undefined && (missing0 = 'sentenceBefore')) ||
        (data.sentenceAfter === undefined && (missing0 = 'sentenceAfter')) ||
        (data.options === undefined && (missing0 = 'options'))
      ) {
        validate43.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.id !== undefined) {
          const _errs1 = errors;
          if (typeof data.id !== 'string') {
            validate43.errors = [
              {
                instancePath: instancePath + '/id',
                schemaPath: '#/properties/id/type',
                keyword: 'type',
                params: { type: 'string' },
                message: 'must be string',
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.kind !== undefined) {
            const _errs3 = errors;
            if (
              !validate44(data.kind, {
                instancePath: instancePath + '/kind',
                parentData: data,
                parentDataProperty: 'kind',
                rootData,
              })
            ) {
              vErrors =
                vErrors === null
                  ? validate44.errors
                  : vErrors.concat(validate44.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.options !== undefined) {
              let data2 = data.options;
              const _errs5 = errors;
              if (errors === _errs5) {
                if (Array.isArray(data2)) {
                  if (data2.length < 2) {
                    validate43.errors = [
                      {
                        instancePath: instancePath + '/options',
                        schemaPath: '#/properties/options/minItems',
                        keyword: 'minItems',
                        params: { limit: 2 },
                        message: 'must NOT have fewer than 2 items',
                      },
                    ];
                    return false;
                  } else {
                    var valid2 = true;
                    const len0 = data2.length;
                    for (let i0 = 0; i0 < len0; i0++) {
                      const _errs7 = errors;
                      if (
                        !validate46(data2[i0], {
                          instancePath: instancePath + '/options/' + i0,
                          parentData: data2,
                          parentDataProperty: i0,
                          rootData,
                        })
                      ) {
                        vErrors =
                          vErrors === null
                            ? validate46.errors
                            : vErrors.concat(validate46.errors);
                        errors = vErrors.length;
                      }
                      var valid2 = _errs7 === errors;
                      if (!valid2) {
                        break;
                      }
                    }
                  }
                } else {
                  validate43.errors = [
                    {
                      instancePath: instancePath + '/options',
                      schemaPath: '#/properties/options/type',
                      keyword: 'type',
                      params: { type: 'array' },
                      message: 'must be array',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.prompt !== undefined) {
                let data4 = data.prompt;
                const _errs8 = errors;
                if (typeof data4 !== 'string' && data4 !== null) {
                  validate43.errors = [
                    {
                      instancePath: instancePath + '/prompt',
                      schemaPath: '#/properties/prompt/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
                var valid0 = _errs8 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.sentenceAfter !== undefined) {
                  let data5 = data.sentenceAfter;
                  const _errs11 = errors;
                  if (typeof data5 !== 'string' && data5 !== null) {
                    validate43.errors = [
                      {
                        instancePath: instancePath + '/sentenceAfter',
                        schemaPath: '#/properties/sentenceAfter/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs11 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.sentenceBefore !== undefined) {
                    let data6 = data.sentenceBefore;
                    const _errs14 = errors;
                    if (typeof data6 !== 'string' && data6 !== null) {
                      validate43.errors = [
                        {
                          instancePath: instancePath + '/sentenceBefore',
                          schemaPath: '#/properties/sentenceBefore/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ];
                      return false;
                    }
                    var valid0 = _errs14 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate43.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate43.errors = vErrors;
  return errors === 0;
}

const schema19 = {
  properties: {
    example: { type: 'string' },
    exampleTranslationUk: { type: 'string' },
    id: { type: 'string' },
    imageAttribution: { type: 'string' },
    imageKey: {
      description: 'Stored vocabulary image object key.',
      type: 'string',
    },
    imageLicense: { type: 'string' },
    imageSourceUrl: { format: 'uri', type: 'string' },
    imageUrl: {
      nullable: true,
      pattern: '^/learning/media\\?key=\\S+$',
      type: 'string',
    },
    transcription: { type: 'string' },
    translationUk: { type: 'string' },
    word: { type: 'string' },
  },
  required: [
    'id',
    'word',
    'transcription',
    'translationUk',
    'example',
    'exampleTranslationUk',
    'imageKey',
    'imageUrl',
    'imageSourceUrl',
    'imageLicense',
    'imageAttribution',
  ],
  type: 'object',
};
const formats0 = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i;

function validate49(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.id === undefined && (missing0 = 'id')) ||
        (data.word === undefined && (missing0 = 'word')) ||
        (data.transcription === undefined && (missing0 = 'transcription')) ||
        (data.translationUk === undefined && (missing0 = 'translationUk')) ||
        (data.example === undefined && (missing0 = 'example')) ||
        (data.exampleTranslationUk === undefined &&
          (missing0 = 'exampleTranslationUk')) ||
        (data.imageKey === undefined && (missing0 = 'imageKey')) ||
        (data.imageUrl === undefined && (missing0 = 'imageUrl')) ||
        (data.imageSourceUrl === undefined && (missing0 = 'imageSourceUrl')) ||
        (data.imageLicense === undefined && (missing0 = 'imageLicense')) ||
        (data.imageAttribution === undefined && (missing0 = 'imageAttribution'))
      ) {
        validate49.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.example !== undefined) {
          const _errs1 = errors;
          if (typeof data.example !== 'string') {
            validate49.errors = [
              {
                instancePath: instancePath + '/example',
                schemaPath: '#/properties/example/type',
                keyword: 'type',
                params: { type: 'string' },
                message: 'must be string',
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.exampleTranslationUk !== undefined) {
            const _errs3 = errors;
            if (typeof data.exampleTranslationUk !== 'string') {
              validate49.errors = [
                {
                  instancePath: instancePath + '/exampleTranslationUk',
                  schemaPath: '#/properties/exampleTranslationUk/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.id !== undefined) {
              const _errs5 = errors;
              if (typeof data.id !== 'string') {
                validate49.errors = [
                  {
                    instancePath: instancePath + '/id',
                    schemaPath: '#/properties/id/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.imageAttribution !== undefined) {
                const _errs7 = errors;
                if (typeof data.imageAttribution !== 'string') {
                  validate49.errors = [
                    {
                      instancePath: instancePath + '/imageAttribution',
                      schemaPath: '#/properties/imageAttribution/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.imageKey !== undefined) {
                  const _errs9 = errors;
                  if (typeof data.imageKey !== 'string') {
                    validate49.errors = [
                      {
                        instancePath: instancePath + '/imageKey',
                        schemaPath: '#/properties/imageKey/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs9 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.imageLicense !== undefined) {
                    const _errs11 = errors;
                    if (typeof data.imageLicense !== 'string') {
                      validate49.errors = [
                        {
                          instancePath: instancePath + '/imageLicense',
                          schemaPath: '#/properties/imageLicense/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ];
                      return false;
                    }
                    var valid0 = _errs11 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.imageSourceUrl !== undefined) {
                      let data6 = data.imageSourceUrl;
                      const _errs13 = errors;
                      if (errors === _errs13) {
                        if (errors === _errs13) {
                          if (typeof data6 === 'string') {
                            if (!formats0.test(data6)) {
                              validate49.errors = [
                                {
                                  instancePath:
                                    instancePath + '/imageSourceUrl',
                                  schemaPath:
                                    '#/properties/imageSourceUrl/format',
                                  keyword: 'format',
                                  params: { format: 'uri' },
                                  message: 'must match format "' + 'uri' + '"',
                                },
                              ];
                              return false;
                            }
                          } else {
                            validate49.errors = [
                              {
                                instancePath: instancePath + '/imageSourceUrl',
                                schemaPath: '#/properties/imageSourceUrl/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              },
                            ];
                            return false;
                          }
                        }
                      }
                      var valid0 = _errs13 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.imageUrl !== undefined) {
                        let data7 = data.imageUrl;
                        const _errs15 = errors;
                        if (typeof data7 !== 'string' && data7 !== null) {
                          validate49.errors = [
                            {
                              instancePath: instancePath + '/imageUrl',
                              schemaPath: '#/properties/imageUrl/type',
                              keyword: 'type',
                              params: { type: 'string' },
                              message: 'must be string',
                            },
                          ];
                          return false;
                        }
                        if (errors === _errs15) {
                          if (typeof data7 === 'string') {
                            if (!pattern0.test(data7)) {
                              validate49.errors = [
                                {
                                  instancePath: instancePath + '/imageUrl',
                                  schemaPath: '#/properties/imageUrl/pattern',
                                  keyword: 'pattern',
                                  params: {
                                    pattern: '^/learning/media\\?key=\\S+$',
                                  },
                                  message:
                                    'must match pattern "' +
                                    '^/learning/media\\?key=\\S+$' +
                                    '"',
                                },
                              ];
                              return false;
                            }
                          }
                        }
                        var valid0 = _errs15 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.transcription !== undefined) {
                          const _errs18 = errors;
                          if (typeof data.transcription !== 'string') {
                            validate49.errors = [
                              {
                                instancePath: instancePath + '/transcription',
                                schemaPath: '#/properties/transcription/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              },
                            ];
                            return false;
                          }
                          var valid0 = _errs18 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.translationUk !== undefined) {
                            const _errs20 = errors;
                            if (typeof data.translationUk !== 'string') {
                              validate49.errors = [
                                {
                                  instancePath: instancePath + '/translationUk',
                                  schemaPath: '#/properties/translationUk/type',
                                  keyword: 'type',
                                  params: { type: 'string' },
                                  message: 'must be string',
                                },
                              ];
                              return false;
                            }
                            var valid0 = _errs20 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.word !== undefined) {
                              const _errs22 = errors;
                              if (typeof data.word !== 'string') {
                                validate49.errors = [
                                  {
                                    instancePath: instancePath + '/word',
                                    schemaPath: '#/properties/word/type',
                                    keyword: 'type',
                                    params: { type: 'string' },
                                    message: 'must be string',
                                  },
                                ];
                                return false;
                              }
                              var valid0 = _errs22 === errors;
                            } else {
                              var valid0 = true;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate49.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate49.errors = vErrors;
  return errors === 0;
}

function validate42(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.words === undefined && (missing0 = 'words')) ||
        (data.questions === undefined && (missing0 = 'questions'))
      ) {
        validate42.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.questions !== undefined) {
          let data0 = data.questions;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (Array.isArray(data0)) {
              var valid1 = true;
              const len0 = data0.length;
              for (let i0 = 0; i0 < len0; i0++) {
                const _errs3 = errors;
                if (
                  !validate43(data0[i0], {
                    instancePath: instancePath + '/questions/' + i0,
                    parentData: data0,
                    parentDataProperty: i0,
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate43.errors
                      : vErrors.concat(validate43.errors);
                  errors = vErrors.length;
                }
                var valid1 = _errs3 === errors;
                if (!valid1) {
                  break;
                }
              }
            } else {
              validate42.errors = [
                {
                  instancePath: instancePath + '/questions',
                  schemaPath: '#/properties/questions/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                },
              ];
              return false;
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.words !== undefined) {
            let data2 = data.words;
            const _errs4 = errors;
            if (errors === _errs4) {
              if (Array.isArray(data2)) {
                var valid2 = true;
                const len1 = data2.length;
                for (let i1 = 0; i1 < len1; i1++) {
                  const _errs6 = errors;
                  if (
                    !validate49(data2[i1], {
                      instancePath: instancePath + '/words/' + i1,
                      parentData: data2,
                      parentDataProperty: i1,
                      rootData,
                    })
                  ) {
                    vErrors =
                      vErrors === null
                        ? validate49.errors
                        : vErrors.concat(validate49.errors);
                    errors = vErrors.length;
                  }
                  var valid2 = _errs6 === errors;
                  if (!valid2) {
                    break;
                  }
                }
              } else {
                validate42.errors = [
                  {
                    instancePath: instancePath + '/words',
                    schemaPath: '#/properties/words/type',
                    keyword: 'type',
                    params: { type: 'array' },
                    message: 'must be array',
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs4 === errors;
          } else {
            var valid0 = true;
          }
        }
      }
    } else {
      validate42.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate42.errors = vErrors;
  return errors === 0;
}

function validate36(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.level === undefined && (missing0 = 'level')) ||
        (data.vocabulary === undefined && (missing0 = 'vocabulary')) ||
        (data.readingTitle === undefined && (missing0 = 'readingTitle')) ||
        (data.readingParagraphs === undefined &&
          (missing0 = 'readingParagraphs')) ||
        (data.questions === undefined && (missing0 = 'questions'))
      ) {
        validate36.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.level !== undefined) {
          const _errs1 = errors;
          if (
            !validate23(data.level, {
              instancePath: instancePath + '/level',
              parentData: data,
              parentDataProperty: 'level',
              rootData,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate23.errors
                : vErrors.concat(validate23.errors);
            errors = vErrors.length;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.questions !== undefined) {
            let data1 = data.questions;
            const _errs3 = errors;
            if (errors === _errs3) {
              if (Array.isArray(data1)) {
                if (data1.length < 1) {
                  validate36.errors = [
                    {
                      instancePath: instancePath + '/questions',
                      schemaPath: '#/properties/questions/minItems',
                      keyword: 'minItems',
                      params: { limit: 1 },
                      message: 'must NOT have fewer than 1 items',
                    },
                  ];
                  return false;
                } else {
                  var valid2 = true;
                  const len0 = data1.length;
                  for (let i0 = 0; i0 < len0; i0++) {
                    const _errs5 = errors;
                    if (
                      !validate38(data1[i0], {
                        instancePath: instancePath + '/questions/' + i0,
                        parentData: data1,
                        parentDataProperty: i0,
                        rootData,
                      })
                    ) {
                      vErrors =
                        vErrors === null
                          ? validate38.errors
                          : vErrors.concat(validate38.errors);
                      errors = vErrors.length;
                    }
                    var valid2 = _errs5 === errors;
                    if (!valid2) {
                      break;
                    }
                  }
                }
              } else {
                validate36.errors = [
                  {
                    instancePath: instancePath + '/questions',
                    schemaPath: '#/properties/questions/type',
                    keyword: 'type',
                    params: { type: 'array' },
                    message: 'must be array',
                  },
                ];
                return false;
              }
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.readingParagraphs !== undefined) {
              let data3 = data.readingParagraphs;
              const _errs6 = errors;
              if (errors === _errs6) {
                if (Array.isArray(data3)) {
                  if (data3.length < 1) {
                    validate36.errors = [
                      {
                        instancePath: instancePath + '/readingParagraphs',
                        schemaPath: '#/properties/readingParagraphs/minItems',
                        keyword: 'minItems',
                        params: { limit: 1 },
                        message: 'must NOT have fewer than 1 items',
                      },
                    ];
                    return false;
                  } else {
                    var valid3 = true;
                    const len1 = data3.length;
                    for (let i1 = 0; i1 < len1; i1++) {
                      const _errs8 = errors;
                      if (typeof data3[i1] !== 'string') {
                        validate36.errors = [
                          {
                            instancePath:
                              instancePath + '/readingParagraphs/' + i1,
                            schemaPath:
                              '#/properties/readingParagraphs/items/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ];
                        return false;
                      }
                      var valid3 = _errs8 === errors;
                      if (!valid3) {
                        break;
                      }
                    }
                  }
                } else {
                  validate36.errors = [
                    {
                      instancePath: instancePath + '/readingParagraphs',
                      schemaPath: '#/properties/readingParagraphs/type',
                      keyword: 'type',
                      params: { type: 'array' },
                      message: 'must be array',
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs6 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.readingTitle !== undefined) {
                const _errs10 = errors;
                if (typeof data.readingTitle !== 'string') {
                  validate36.errors = [
                    {
                      instancePath: instancePath + '/readingTitle',
                      schemaPath: '#/properties/readingTitle/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
                var valid0 = _errs10 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.vocabulary !== undefined) {
                  const _errs12 = errors;
                  if (
                    !validate42(data.vocabulary, {
                      instancePath: instancePath + '/vocabulary',
                      parentData: data,
                      parentDataProperty: 'vocabulary',
                      rootData,
                    })
                  ) {
                    vErrors =
                      vErrors === null
                        ? validate42.errors
                        : vErrors.concat(validate42.errors);
                    errors = vErrors.length;
                  }
                  var valid0 = _errs12 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate36.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate36.errors = vErrors;
  return errors === 0;
}

function validate33(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.slug === undefined && (missing0 = 'slug')) ||
        (data.coverImageUrl === undefined && (missing0 = 'coverImageUrl')) ||
        (data.title === undefined && (missing0 = 'title')) ||
        (data.description === undefined && (missing0 = 'description')) ||
        (data.availableLevels === undefined &&
          (missing0 = 'availableLevels')) ||
        (data.topicSlug === undefined && (missing0 = 'topicSlug')) ||
        (data.readingImageUrl === undefined &&
          (missing0 = 'readingImageUrl')) ||
        (data.readingCheckImageUrl === undefined &&
          (missing0 = 'readingCheckImageUrl')) ||
        (data.resultsImageUrl === undefined &&
          (missing0 = 'resultsImageUrl')) ||
        (data.supportedLevels === undefined &&
          (missing0 = 'supportedLevels')) ||
        (data.variant === undefined && (missing0 = 'variant'))
      ) {
        validate33.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.availableLevels !== undefined) {
          let data0 = data.availableLevels;
          const _errs1 = errors;
          if (errors === _errs1) {
            if (Array.isArray(data0)) {
              var valid1 = true;
              const len0 = data0.length;
              for (let i0 = 0; i0 < len0; i0++) {
                const _errs3 = errors;
                if (
                  !validate23(data0[i0], {
                    instancePath: instancePath + '/availableLevels/' + i0,
                    parentData: data0,
                    parentDataProperty: i0,
                    rootData,
                  })
                ) {
                  vErrors =
                    vErrors === null
                      ? validate23.errors
                      : vErrors.concat(validate23.errors);
                  errors = vErrors.length;
                }
                var valid1 = _errs3 === errors;
                if (!valid1) {
                  break;
                }
              }
            } else {
              validate33.errors = [
                {
                  instancePath: instancePath + '/availableLevels',
                  schemaPath: '#/properties/availableLevels/type',
                  keyword: 'type',
                  params: { type: 'array' },
                  message: 'must be array',
                },
              ];
              return false;
            }
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.coverImageUrl !== undefined) {
            let data2 = data.coverImageUrl;
            const _errs4 = errors;
            if (typeof data2 !== 'string' && data2 !== null) {
              validate33.errors = [
                {
                  instancePath: instancePath + '/coverImageUrl',
                  schemaPath: '#/properties/coverImageUrl/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            if (errors === _errs4) {
              if (typeof data2 === 'string') {
                if (!pattern0.test(data2)) {
                  validate33.errors = [
                    {
                      instancePath: instancePath + '/coverImageUrl',
                      schemaPath: '#/properties/coverImageUrl/pattern',
                      keyword: 'pattern',
                      params: { pattern: '^/learning/media\\?key=\\S+$' },
                      message:
                        'must match pattern "' +
                        '^/learning/media\\?key=\\S+$' +
                        '"',
                    },
                  ];
                  return false;
                }
              }
            }
            var valid0 = _errs4 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.description !== undefined) {
              const _errs7 = errors;
              if (typeof data.description !== 'string') {
                validate33.errors = [
                  {
                    instancePath: instancePath + '/description',
                    schemaPath: '#/properties/description/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
              var valid0 = _errs7 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.readingCheckImageUrl !== undefined) {
                let data4 = data.readingCheckImageUrl;
                const _errs9 = errors;
                if (typeof data4 !== 'string' && data4 !== null) {
                  validate33.errors = [
                    {
                      instancePath: instancePath + '/readingCheckImageUrl',
                      schemaPath: '#/properties/readingCheckImageUrl/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
                if (errors === _errs9) {
                  if (typeof data4 === 'string') {
                    if (!pattern0.test(data4)) {
                      validate33.errors = [
                        {
                          instancePath: instancePath + '/readingCheckImageUrl',
                          schemaPath:
                            '#/properties/readingCheckImageUrl/pattern',
                          keyword: 'pattern',
                          params: { pattern: '^/learning/media\\?key=\\S+$' },
                          message:
                            'must match pattern "' +
                            '^/learning/media\\?key=\\S+$' +
                            '"',
                        },
                      ];
                      return false;
                    }
                  }
                }
                var valid0 = _errs9 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.readingImageUrl !== undefined) {
                  let data5 = data.readingImageUrl;
                  const _errs12 = errors;
                  if (typeof data5 !== 'string' && data5 !== null) {
                    validate33.errors = [
                      {
                        instancePath: instancePath + '/readingImageUrl',
                        schemaPath: '#/properties/readingImageUrl/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                  if (errors === _errs12) {
                    if (typeof data5 === 'string') {
                      if (!pattern0.test(data5)) {
                        validate33.errors = [
                          {
                            instancePath: instancePath + '/readingImageUrl',
                            schemaPath: '#/properties/readingImageUrl/pattern',
                            keyword: 'pattern',
                            params: { pattern: '^/learning/media\\?key=\\S+$' },
                            message:
                              'must match pattern "' +
                              '^/learning/media\\?key=\\S+$' +
                              '"',
                          },
                        ];
                        return false;
                      }
                    }
                  }
                  var valid0 = _errs12 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.resultsImageUrl !== undefined) {
                    let data6 = data.resultsImageUrl;
                    const _errs15 = errors;
                    if (typeof data6 !== 'string' && data6 !== null) {
                      validate33.errors = [
                        {
                          instancePath: instancePath + '/resultsImageUrl',
                          schemaPath: '#/properties/resultsImageUrl/type',
                          keyword: 'type',
                          params: { type: 'string' },
                          message: 'must be string',
                        },
                      ];
                      return false;
                    }
                    if (errors === _errs15) {
                      if (typeof data6 === 'string') {
                        if (!pattern0.test(data6)) {
                          validate33.errors = [
                            {
                              instancePath: instancePath + '/resultsImageUrl',
                              schemaPath:
                                '#/properties/resultsImageUrl/pattern',
                              keyword: 'pattern',
                              params: {
                                pattern: '^/learning/media\\?key=\\S+$',
                              },
                              message:
                                'must match pattern "' +
                                '^/learning/media\\?key=\\S+$' +
                                '"',
                            },
                          ];
                          return false;
                        }
                      }
                    }
                    var valid0 = _errs15 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.slug !== undefined) {
                      const _errs18 = errors;
                      if (typeof data.slug !== 'string') {
                        validate33.errors = [
                          {
                            instancePath: instancePath + '/slug',
                            schemaPath: '#/properties/slug/type',
                            keyword: 'type',
                            params: { type: 'string' },
                            message: 'must be string',
                          },
                        ];
                        return false;
                      }
                      var valid0 = _errs18 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.supportedLevels !== undefined) {
                        let data8 = data.supportedLevels;
                        const _errs20 = errors;
                        if (errors === _errs20) {
                          if (Array.isArray(data8)) {
                            var valid2 = true;
                            const len1 = data8.length;
                            for (let i1 = 0; i1 < len1; i1++) {
                              const _errs22 = errors;
                              if (
                                !validate23(data8[i1], {
                                  instancePath:
                                    instancePath + '/supportedLevels/' + i1,
                                  parentData: data8,
                                  parentDataProperty: i1,
                                  rootData,
                                })
                              ) {
                                vErrors =
                                  vErrors === null
                                    ? validate23.errors
                                    : vErrors.concat(validate23.errors);
                                errors = vErrors.length;
                              }
                              var valid2 = _errs22 === errors;
                              if (!valid2) {
                                break;
                              }
                            }
                          } else {
                            validate33.errors = [
                              {
                                instancePath: instancePath + '/supportedLevels',
                                schemaPath: '#/properties/supportedLevels/type',
                                keyword: 'type',
                                params: { type: 'array' },
                                message: 'must be array',
                              },
                            ];
                            return false;
                          }
                        }
                        var valid0 = _errs20 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.title !== undefined) {
                          const _errs23 = errors;
                          if (typeof data.title !== 'string') {
                            validate33.errors = [
                              {
                                instancePath: instancePath + '/title',
                                schemaPath: '#/properties/title/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string',
                              },
                            ];
                            return false;
                          }
                          var valid0 = _errs23 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.topicSlug !== undefined) {
                            const _errs25 = errors;
                            if (typeof data.topicSlug !== 'string') {
                              validate33.errors = [
                                {
                                  instancePath: instancePath + '/topicSlug',
                                  schemaPath: '#/properties/topicSlug/type',
                                  keyword: 'type',
                                  params: { type: 'string' },
                                  message: 'must be string',
                                },
                              ];
                              return false;
                            }
                            var valid0 = _errs25 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.variant !== undefined) {
                              let data12 = data.variant;
                              const _errs27 = errors;
                              const _errs28 = errors;
                              let valid3 = false;
                              let passing0 = null;
                              const _errs29 = errors;
                              if (
                                !validate36(data12, {
                                  instancePath: instancePath + '/variant',
                                  parentData: data,
                                  parentDataProperty: 'variant',
                                  rootData,
                                })
                              ) {
                                vErrors =
                                  vErrors === null
                                    ? validate36.errors
                                    : vErrors.concat(validate36.errors);
                                errors = vErrors.length;
                              }
                              var _valid0 = _errs29 === errors;
                              if (_valid0) {
                                valid3 = true;
                                passing0 = 0;
                              }
                              const _errs30 = errors;
                              if (
                                !(
                                  data12 &&
                                  typeof data12 == 'object' &&
                                  !Array.isArray(data12)
                                ) &&
                                data12 !== null
                              ) {
                                const err0 = {
                                  instancePath: instancePath + '/variant',
                                  schemaPath:
                                    '#/properties/variant/oneOf/1/type',
                                  keyword: 'type',
                                  params: { type: 'object' },
                                  message: 'must be object',
                                };
                                if (vErrors === null) {
                                  vErrors = [err0];
                                } else {
                                  vErrors.push(err0);
                                }
                                errors++;
                              }
                              if (!(data12 === null)) {
                                const err1 = {
                                  instancePath: instancePath + '/variant',
                                  schemaPath:
                                    '#/properties/variant/oneOf/1/enum',
                                  keyword: 'enum',
                                  params: {
                                    allowedValues:
                                      schema11.properties.variant.oneOf[1].enum,
                                  },
                                  message:
                                    'must be equal to one of the allowed values',
                                };
                                if (vErrors === null) {
                                  vErrors = [err1];
                                } else {
                                  vErrors.push(err1);
                                }
                                errors++;
                              }
                              var _valid0 = _errs30 === errors;
                              if (_valid0 && valid3) {
                                valid3 = false;
                                passing0 = [passing0, 1];
                              } else {
                                if (_valid0) {
                                  valid3 = true;
                                  passing0 = 1;
                                }
                              }
                              if (!valid3) {
                                const err2 = {
                                  instancePath: instancePath + '/variant',
                                  schemaPath: '#/properties/variant/oneOf',
                                  keyword: 'oneOf',
                                  params: { passingSchemas: passing0 },
                                  message:
                                    'must match exactly one schema in oneOf',
                                };
                                if (vErrors === null) {
                                  vErrors = [err2];
                                } else {
                                  vErrors.push(err2);
                                }
                                errors++;
                                validate33.errors = vErrors;
                                return false;
                              } else {
                                errors = _errs28;
                                if (vErrors !== null) {
                                  if (_errs28) {
                                    vErrors.length = _errs28;
                                  } else {
                                    vErrors = null;
                                  }
                                }
                              }
                              var valid0 = _errs27 === errors;
                            } else {
                              var valid0 = true;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate33.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate33.errors = vErrors;
  return errors === 0;
}

exports.isCheckReadingAnswerResponse = validate53;
const schema20 = {
  properties: {
    correctOptionId: { type: 'string' },
    explanation: { type: 'string' },
    isCorrect: { type: 'boolean' },
    questionId: { type: 'string' },
    selectedOptionId: { type: 'string' },
  },
  required: [
    'questionId',
    'selectedOptionId',
    'correctOptionId',
    'isCorrect',
    'explanation',
  ],
  type: 'object',
};

function validate53(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.questionId === undefined && (missing0 = 'questionId')) ||
        (data.selectedOptionId === undefined &&
          (missing0 = 'selectedOptionId')) ||
        (data.correctOptionId === undefined &&
          (missing0 = 'correctOptionId')) ||
        (data.isCorrect === undefined && (missing0 = 'isCorrect')) ||
        (data.explanation === undefined && (missing0 = 'explanation'))
      ) {
        validate53.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.correctOptionId !== undefined) {
          const _errs1 = errors;
          if (typeof data.correctOptionId !== 'string') {
            validate53.errors = [
              {
                instancePath: instancePath + '/correctOptionId',
                schemaPath: '#/properties/correctOptionId/type',
                keyword: 'type',
                params: { type: 'string' },
                message: 'must be string',
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.explanation !== undefined) {
            const _errs3 = errors;
            if (typeof data.explanation !== 'string') {
              validate53.errors = [
                {
                  instancePath: instancePath + '/explanation',
                  schemaPath: '#/properties/explanation/type',
                  keyword: 'type',
                  params: { type: 'string' },
                  message: 'must be string',
                },
              ];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.isCorrect !== undefined) {
              const _errs5 = errors;
              if (typeof data.isCorrect !== 'boolean') {
                validate53.errors = [
                  {
                    instancePath: instancePath + '/isCorrect',
                    schemaPath: '#/properties/isCorrect/type',
                    keyword: 'type',
                    params: { type: 'boolean' },
                    message: 'must be boolean',
                  },
                ];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.questionId !== undefined) {
                const _errs7 = errors;
                if (typeof data.questionId !== 'string') {
                  validate53.errors = [
                    {
                      instancePath: instancePath + '/questionId',
                      schemaPath: '#/properties/questionId/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.selectedOptionId !== undefined) {
                  const _errs9 = errors;
                  if (typeof data.selectedOptionId !== 'string') {
                    validate53.errors = [
                      {
                        instancePath: instancePath + '/selectedOptionId',
                        schemaPath: '#/properties/selectedOptionId/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs9 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      }
    } else {
      validate53.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate53.errors = vErrors;
  return errors === 0;
}

exports.isCheckVocabularyAnswerResponse = validate54;
const schema21 = {
  properties: {
    correctOptionId: { type: 'string' },
    isCorrect: { type: 'boolean' },
    questionId: { type: 'string' },
    selectedOptionId: { type: 'string' },
    sentenceTranslationUk: { nullable: true, type: 'string' },
    word: { $ref: '#/components/schemas/VocabularyLessonWord' },
  },
  required: [
    'questionId',
    'selectedOptionId',
    'correctOptionId',
    'isCorrect',
    'word',
    'sentenceTranslationUk',
  ],
  type: 'object',
};

function validate54(
  data,
  { instancePath = '', parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == 'object' && !Array.isArray(data)) {
      let missing0;
      if (
        (data.questionId === undefined && (missing0 = 'questionId')) ||
        (data.selectedOptionId === undefined &&
          (missing0 = 'selectedOptionId')) ||
        (data.correctOptionId === undefined &&
          (missing0 = 'correctOptionId')) ||
        (data.isCorrect === undefined && (missing0 = 'isCorrect')) ||
        (data.word === undefined && (missing0 = 'word')) ||
        (data.sentenceTranslationUk === undefined &&
          (missing0 = 'sentenceTranslationUk'))
      ) {
        validate54.errors = [
          {
            instancePath,
            schemaPath: '#/required',
            keyword: 'required',
            params: { missingProperty: missing0 },
            message: "must have required property '" + missing0 + "'",
          },
        ];
        return false;
      } else {
        if (data.correctOptionId !== undefined) {
          const _errs1 = errors;
          if (typeof data.correctOptionId !== 'string') {
            validate54.errors = [
              {
                instancePath: instancePath + '/correctOptionId',
                schemaPath: '#/properties/correctOptionId/type',
                keyword: 'type',
                params: { type: 'string' },
                message: 'must be string',
              },
            ];
            return false;
          }
          var valid0 = _errs1 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.isCorrect !== undefined) {
            const _errs3 = errors;
            if (typeof data.isCorrect !== 'boolean') {
              validate54.errors = [
                {
                  instancePath: instancePath + '/isCorrect',
                  schemaPath: '#/properties/isCorrect/type',
                  keyword: 'type',
                  params: { type: 'boolean' },
                  message: 'must be boolean',
                },
              ];
              return false;
            }
            var valid0 = _errs3 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.questionId !== undefined) {
              const _errs5 = errors;
              if (typeof data.questionId !== 'string') {
                validate54.errors = [
                  {
                    instancePath: instancePath + '/questionId',
                    schemaPath: '#/properties/questionId/type',
                    keyword: 'type',
                    params: { type: 'string' },
                    message: 'must be string',
                  },
                ];
                return false;
              }
              var valid0 = _errs5 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.selectedOptionId !== undefined) {
                const _errs7 = errors;
                if (typeof data.selectedOptionId !== 'string') {
                  validate54.errors = [
                    {
                      instancePath: instancePath + '/selectedOptionId',
                      schemaPath: '#/properties/selectedOptionId/type',
                      keyword: 'type',
                      params: { type: 'string' },
                      message: 'must be string',
                    },
                  ];
                  return false;
                }
                var valid0 = _errs7 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.sentenceTranslationUk !== undefined) {
                  let data4 = data.sentenceTranslationUk;
                  const _errs9 = errors;
                  if (typeof data4 !== 'string' && data4 !== null) {
                    validate54.errors = [
                      {
                        instancePath: instancePath + '/sentenceTranslationUk',
                        schemaPath: '#/properties/sentenceTranslationUk/type',
                        keyword: 'type',
                        params: { type: 'string' },
                        message: 'must be string',
                      },
                    ];
                    return false;
                  }
                  var valid0 = _errs9 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.word !== undefined) {
                    const _errs12 = errors;
                    if (
                      !validate49(data.word, {
                        instancePath: instancePath + '/word',
                        parentData: data,
                        parentDataProperty: 'word',
                        rootData,
                      })
                    ) {
                      vErrors =
                        vErrors === null
                          ? validate49.errors
                          : vErrors.concat(validate49.errors);
                      errors = vErrors.length;
                    }
                    var valid0 = _errs12 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate54.errors = [
        {
          instancePath,
          schemaPath: '#/type',
          keyword: 'type',
          params: { type: 'object' },
          message: 'must be object',
        },
      ];
      return false;
    }
  }
  validate54.errors = vErrors;
  return errors === 0;
}
