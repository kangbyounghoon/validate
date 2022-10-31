(function (global, factory) {
    if (typeof define === "function" && define.amd) {
      define("validate", factory);
    } else if (typeof module === "object" && module.exports) {
      module.exports = factory(require("underscore"));
    } else {
      global.validate ? global.atomyValidate = factory(global) : global.validate = factory(global);
    }

  }(this,
    (function (global) {
      if (!global._) {
        // https://underscorejs.org/
        fail("언더스코어 라이브러리를 찾을 수 없습니다.");
      }
      const _ = global._;
      const VERSION = '1.0.0';

      /**
       * 유틸 함수
       * undefined, null => false, 외 true
       * @param x
       * @returns {boolean}
       */
      function existy(x) {
        return x != null;
      }

      /**
       * 유틸 함수
       * undefined, null, false => false, 외 true
       * @param x
       * @returns {boolean}
       */
      function truthy(x) {
        return existy(x) && x !== false;
      }

      /**
       * 유틸 함수
       * 배열형식의 가변인자를 받아 연결하는 기능.
       * @returns {*[]|*}
       */
      function cat(/* arrays */) {
        const head = _.first(arguments);
        if (existy(head)) return head.concat.apply(head, _.rest(arguments));
        else return [];
      }

      /**
       * 유틸 함수.
       * 요소와 배열을 인자로 받아 배열 첫번째 인덱스에 요소를 추가하는 기능.
       * @param head
       * @param tail
       * @returns {*[]|*}
       */
      function construct(head, tail) {
        return cat([head], _.toArray(tail));
      }

      /**
       * map에 해당하는 연산의 결과배열을 일차원 배열로 연결하는 기능.
       * @param fun
       * @param coll
       * @returns {*[]|*}
       */
      function mapcat(fun, coll) {
        return cat.apply(null, _.map(coll, fun));
      }

      /**
       * 유효성 함수 데코레이터
       * 찬반형의함수에 유효성검사 실패 시 에러 메시지기능 추가 기능.
       * @param message
       * @param fun
       * @returns {function(): *}
       */
      function validator(message, fun) {
        const f = function (/* args */) {
          return fun.apply(fun, _.toArray(arguments));
        };
        f['message'] = message;
        return f;
      }

      /**
       * 객체 검증자
       * true나 false를 반환하는 찬반형 함수들을 인자로 받아 검증함수를 반환하는 checker 함수
       * 반환되는 검증함수는 주어진 객체에 각 찬반형을 실행한 다음에 찬반형이 false를 반환하면 배열에 정해진 에러 문자열을 추가한다.
       * 모든 찬반형이 true를 반환하면 최종 결과는 빈 배열이 된다. 하지만 에러가 발생했다면 배열에 에러 메시지가 들어있을 것이다.
       * @returns {function(*): *}
       */
      function checker(/* validators */) {
        const validators = _.toArray(arguments);
        return function (obj) {
          return _.reduce(validators, function (errs, check) {
            if (check(obj)) {
              return errs;
            } else {
              return _.chain(errs).push(
                {
                  type: _.has(check, 'type') ? check['type'] : undefined,
                  message: check.message
                }
              ).value();
            }
          }, []);
        };
      }

      /**
       *
       * 특정 동작을 수행하는 함수들을 인자로 받아 구동함수를 반환하는 dispatch 함수.
       *
       * @returns {(function(*): (*))|*}
       */
      function dispatch(/* funs */) {
        const funs = _.toArray(arguments);
        const size = funs.length;
        return function (target/*, args*/) {
          if (!existy(target)) fail('target 변수는 반드시 제공되어야 합니다.');
          let ret = undefined;
          const args = _.rest(arguments);

          for (let funIndex = 0; funIndex < size; funIndex++) {
            const fun = funs[funIndex];
            ret = fun.apply(fun, construct(target, args));
            if (existy(ret)) return ret;
          }

          return ret;
        };
      }

      /**
       * 에러메세지
       * @param thing
       */
      function fail(thing) {
        throw new Error(thing);
      }

      /**
       * 경고메세지
       * @param thing
       */
      function warn(thing) {
        console.log(["WARNING:", thing].join(" "));
      }

      /**
       * 정보메세지
       * @param thing
       */
      function note(thing) {
        console.log(["NOTE:", thing].join(" "));
      }

      /**
       * 설정된 키값을 인자로 받아 반환된 함수의 인자와 키값비교 기능.
       * @returns {function(*): *}
       */
      function hasKeys(/* keys */) {
        const keys = _.toArray(arguments);
        const fun = function (obj) {
          return _.every(keys, function (k) {
            return _.has(obj, k);
          });
        };
        fun.message = cat(['요청된 키 값이 없습니다.', keys]).join("");
        return fun;
      }

      /**
       * hasKeys 함수 동적 인자 바인딩 기능.
       * @param keys
       * @returns {function(*): *}
       */
      function dynamicHasKeys(keys) {
        return hasKeys.apply(null, keys);
      }

      /**
       * 조립함수
       * 한개의 인자를 받는 커리된 함수.
       * @param fun
       * @returns {function(*): *}
       */
      function curry(fun) {
        return function (arg) {
          return fun(arg);
        };
      }

      /**
       * 조립함수
       * 두개의 인자를 받는 커리된 함수.
       * @param fun
       * @returns {function(*): function(*): *}
       */
      function curry2(fun) {
        return function (secondArg) {
          return function (firstArg) {
            return fun(firstArg, secondArg);
          };
        };
      }

      /**
       * 조립함수
       * 세개의 인자를 받는 커리된 함수.
       * @param fun
       * @returns {function(*): function(*): function(*): *}
       */
      function curry3(fun) {
        return function (last) {
          return function (middle) {
            return function (first) {
              return fun(first, middle, last);
            };
          };
        };
      }

      /**
       * true or false 를 반환하는 찬반형함수를 인자로 받아 결과 찬반형을 부정하는 함수.
       * @param pred
       * @returns {function(): boolean}
       */
      function complement(pred) {
        return function (/* arguments */) {
          return !pred.apply(null, _.toArray(arguments));
        };
      }

      /**
       * 객체의 키 속성 값을 인자로 받아 반환함수의 인자객체 내부 키 속성 값을 반환하는 함수.
       * @param name
       * @returns {function(*)}
       */
      function plucker(name) {
        return function (obj) {
          return (obj && obj[name]);
        };
      }

      /**
       * 선행조건에서 rules의 유효성 검증 함수.
       * @param obj
       * @returns {*}
       */
      function rulesType(obj) {
        const rules = getRules(obj);
        return (rules && _.isArray(rules));
      }

      /**
       * 선행조건에서 rules의 유효성 검증
       * @param obj
       * @returns {boolean|boolean}
       */
      function rulesLengthZero(obj) {
        const rules = getRules(obj);
        return existy(rules) ? (0 === rules.length) : false;
      }

      /**
       * 조립함수.
       * 부분적용함수
       * @param fun
       * @param arg1
       * @returns {function(): *}
       */
      function partial1(fun, arg1) {
        return function (/* arguments */) {
          const args = construct(arg1, _.toArray(arguments));
          return fun.apply(fun, args);
        };
      }

      /**
       * 기본설정데이터
       */
      const Config = (function () {

        function checkable(element) {
          return (/radio|checkbox/i).test(element.type);
        }

        function getData(obj) {
          const doc = global.document;
          if (!existy(doc)) return _.has(obj, 'value') ? obj['value'] : '';
          const element = doc.getElementById(obj.id) || doc.getElementsByName(obj.id);

          if (element.nodeName && element.nodeName.toLowerCase() === "select") {
            const val = element.value;
            return val && val.length > 0;
          }

          if (Object.prototype.toString.call(element) === '[object NodeList]') {
            let result = doc.querySelectorAll("input[name='" + obj.id + "']:checked");
            if (result.length === 0) return [];

            return _.reduce(result, function (values, e) {
              return checkable(e) ? _.chain(values).push(e.value).value() : values;
            }, []);
          }

          return element.value;
        }

        const requiredKeys = ['id', 'type', 'rules'];
        const requiredRuleKeys = ['type', 'message'];

        /**
         * 배포 후 개발자가 해당 법인의 유효성 검증 레벨의 함수 추가시 손댈 부분.
         */
        return {
          getRequiredKeys: function () {
            return requiredKeys;
          },
          getRequiredRuleKeys: function () {
            return requiredRuleKeys;
          },
          rules: ['required', 'email', 'maxlength', 'minlength', 'max', 'min', 'digits', 'number'],
          methods: {
            // 두번째 인자 현재 규칙, 세번째 총 데이터
            required: function (obj/*, rule, origins*/) {
              let value = getData(obj);
              if (!_.isString(value) || !_.isArray(value)) {
                value = value.toString();
              }
              note(['method : required ', ' obj.id :', obj.id, ' value :', value, ' value.length > 0 :', value.length > 0].join(''));
              return value.length > 0;
            },
            maxlength: function (obj/*, rule, origins*/) {
              let value = getData(obj);
              const maxlength = plucker('length')(_.rest(arguments)[0]);
              if (!_.isString(value) || !_.isArray(value)) {
                value = value.toString();
              }
              note(['method : maxlength ', ' obj.id :', obj.id, ' value :', value, ' maxlnegth :', maxlength, ' value.length < maxlength :', value.length < maxlength].join(''))
              return value.length < maxlength;
            },
            minlength: function (obj/*, rule, origins*/) {
              let value = getData(obj);
              const minlength = plucker('length')(_.rest(arguments)[0]);
              if (!_.isString(value) || !_.isArray(value)) {
                value = value.toString();
              }
              note(['method : minlength ', ' obj.id :', obj.id, ' value :', value, ' minlength :', minlength, ' value.length > minlength :', value.length > minlength].join(''))
              return value.length > minlength;
            },
            email: function (obj/*, rule, origins*/) {
              let value = getData(obj);
              note(['method : email', ' obj.id :', obj.id, new RegExp(
                /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/), '.test(value) :',
                /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value)].join('')
              );
              return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value);
            },
            max: function (obj/*, rule, origins*/) {
              let value = getData(obj);
              const maxValue = plucker('value')(_.rest(arguments)[0]);
              note(['method : max ', ' obj.id :', obj.id, ' value :', value, ' value < maxValue :', value < maxValue].join(''));
              return value < maxValue;
            },
            min: function (obj/*, rule, origins*/) {
              let value = getData(obj);
              const minValue = plucker('value')(_.rest(arguments)[0]);
              note(['method : min ', ' obj.id :', obj.id, ' value :', value, ' value > minValue :', value > minValue].join(''));
              return value > minValue;
            },
            digits: function (obj/*, rule, origins*/) {
              const value = getData(obj);
              note(['method : digits ', ' obj.id :', obj.id, ' value :', value,
                new RegExp(/^\d+$/), '.test(value) :', /^\d+$/.test(value)].join(''));
              return /^\d+$/.test(value)
            },
            number: function (obj/*, rule, origins*/) {
              const value = getData(obj);
              note(['method : digits ', ' obj.id :', obj.id, ' value :', value,
                new RegExp(/^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/), '.test(value) :', /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value)].join(''));
              return /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
            },
            /**
             * 비즈니스에 맞는 유효성 검사 필요시 해당 영역에 추가한다.
             */
          },
        }
      }());

      /**
       * 반환된 함수의 인자에 선행으로 함수들을 동작 시킨 후 문제가 없다면 로직함수를 실행한다.
       * @returns {function(*, *): *}
       */
      function condition1(/* validators */) {
        const validators = _.toArray(arguments);
        return function (fun, arg) {
          const errors = mapcat(function (isValid) {
            return isValid(arg) ? [] : [isValid.message];
          }, validators);
          if (!_.isEmpty(errors)) fail(errors.join(", "));
          return fun(arg);
        }
      }

      // 개발자(clientData)의 설정데이터를 검증하기위한 로직들
      const getRules = plucker('rules');

      const validateKeys = partial1(dynamicHasKeys, Config.getRequiredKeys);
      const validateRuleKeys = partial1(dynamicHasKeys, Config.getRequiredRuleKeys());

      /**
       * clientData 검증자
       * 선행조건 중 clientData 속성에 대한 유효성검증 추가시 해당 함수에 추가한다.
       * 1. 셋업데이터 필수 키값 검증
       * 2. rules 속성의 배열타입 검증
       * 3. >0 검증
       * @type {function(*, *): *}
       */
      const initPre = condition1(
        validateKeys(),
        validator('rules 속성은 배열형식이어야 합니다.', rulesType),
        validator('rules 길이는 0 보다 커야 합니다.', complement(rulesLengthZero)),
      )

      /**
       * rules 배열 내 검증자
       * 선행조건 중 rules 속성에 대한 유효성검증 추가시 해당 함수에 추가한다.
       * 1. rules 배열 안 요소객체에 대해 요구되는 키값들이 있는지 검증
       * @type {function(*, *): *}
       */
      const rulePre = condition1(
        validateRuleKeys()
      );

      const checkedRules = partial1(rulePre, _.identity);
      // console.log(checkedRules(getRules(data[0])[0]));

      const checkedRulesBridge = isa1(getRules, checkedRules);

      // console.log(checkedRulesBridge(data[0]));

      /**
       * 데이터 통분함수, 동작함수를 인자로 받아 반환함수가 데이터를 인자로 받아 동작을 결정한다.
       * @param initFun
       * @param action
       * @returns {function(*): *}
       */
      function isa1(initFun, action) {
        return function (obj) {
          const targetData = initFun(obj);  //데이터 통분 함수
          _.map(targetData, function (data) {
            return action(data);
          });
          return obj;
        };
      }

      /**
       * 제어문 함수.
       * 아이디와 동작함수를 인자로받아 객체의 아이디와 같으면 동작함수를 실행하는 기능.
       * @param id
       * @param action
       * @returns {(function(*): (*|undefined))|*}
       */
      function isa(id, action) {
        return function (obj) {
          if (id === obj.id) {
            return action(obj); //checker.closure
          }
        };
      }

      /**
       * 제어문 함수인 isa 함수의 인자를 동적으로 적용하는 기능.
       * @param arg
       * @returns {(function(*): (*|undefined))|*}
       */
      function dynamicIsa(arg) {
        return isa.apply(null, arg);
      }

      /**
       * 클라이언트데이터(validate 인자)정보를 토대로 유효성함수를 동적으로 생성한다.
       * @param configRules
       * @param configMethods
       * @returns {function(*): *}
       */
      function createValidate(configRules, configMethods) {
        return function (data, allData) {
          const rules = getRules(data);

          return _.reduce(rules, function (result, rule) {
            const type = rule.type;

            if (_.contains(configRules, type) && _.has(configMethods, type)) {
              const validFun = configMethods[type];

              // console.log('origin.id :', origin.id, 'message :', messageFormat(origin, rule));
              const f = validator(messageFormat(data, rule), curry3(validFun)(allData)(rule));
              f['type'] = type;
              return _.chain(result).push(f).value();
            } else {
              return result;
            }
          }, []);
        }
      }

      /**
       * 유효성검사 함수의 메시지를 변환 후 반환하는 기능.
       * @param origin
       * @param rule
       * @returns {*}
       */
      function messageFormat(origin, rule) {
        let message = rule.message;
        const theregex = /\$?\{(\w+)\}/g;
        return theregex.test(message) ?
          message.replace(theregex, function (a, v) {
            // console.log('message :', message, ' a :', a, 'v :', v);
            if (v === 'id') {
              return origin[v] || a;
            } else {
              return rule[v] || a;
            }
          }) : message;
      }

      //하나의 대상요소 기준으로 유효성함수 저장소를 만든다.
      const unityValidate = createValidate(Config.rules, Config.methods);

      /**
       * checker 함수의 인자를 동적 바인딩 하는 함수.
       * @param arg
       * @returns {function(*): *}
       */
      function dynamicChecker(arg) {
        return checker.apply(null, arg);
      }

      /**
       * 대상요소로 구성된 배열을 인자로 받아 map 연산을 통해 요소별 유효성함수를 만든다.
       * @param clientData
       * @returns {(function(*): *)|*}
       */
      function createValidateBizRepo(clientData) {
        // valid..(N) -> checker(1) -> isa(1) 관계
        const retIsa = _.map(clientData, function (data, idx, allData) {
          const arg = construct(data.id, [dynamicChecker(unityValidate(data, allData))]);
          return dynamicIsa(arg);
        });
        return dispatch.apply(null, retIsa);
      }

      /**
       * 저장소를 인자로 받아 함수를 반환하고 반환된함수의 인자에 설정데이터(clientData)를 받아 유효성검사를 시작한다.
       * @param validateRepoFun
       * @returns {function(*): *}
       */
      function coreValidate(validateRepoFun) {
        return function (clientData) {
          return _.reduce(clientData, function (errs, data) {
            // [] or [...] or undefined
            const ret = validateRepoFun(data);
            if (!existy(ret)) fail("비즈니스 유효성 검사에서 undefined 데이터가 반환되었습니다.");

            if (_.isEmpty(ret)) return _.chain(errs).push({
              // source: data,
              source: _.omit(data, 'rules'),
              rules: getRules(data),
              status: 'success',
              errorMessage: []
            }).value();
            else return _.chain(errs).push({
              // source: data,
              source: _.omit(data, 'rules'),
              rules: getRules(data),
              status: 'errors', errorMessage: ret
            }).value();
          }, []);
        }
      }

      return function (clientData) {
        note(VERSION);
        note(['ibro-', (VERSION + Math.random()).replace(/\D/g, "")].join(''));

        /**
         * 인자로 넘어온 데이터 배열 안 요소객체 단건 기준 선행처리 함수.
         * @type {function(): *}
         */
        const unityInitPre = partial1(initPre, checkedRulesBridge);
        // console.log(unityInitPre(data[0]));

        /**
         * 인자 데이터의 소스레벨 선행 필수 유효성검사
         * @type {function(*): *}
         */
        const validatePre = isa1(_.identity, unityInitPre);
        // const preResult = validatePre(data)
        // console.log(
        //   'preResult ', preResult
        // )

        /**
         * TODO
         * 선행조건을 패스한 데이터의 rules 속성기준 요청된 유효성 데이터 기반으로 실제 구동할 함수들을 조립한다.
         */
          // console.log(
          //   unityValidate(data[0], data).toString()
          // )
          //
          // console.log(
          //   unityValidate(data[0])
          // );
          //
          // console.log(
          //   dynamicChecker(unityValidate(data[0], data)).toString()
          // );
          //
          // console.log(
          //   dynamicChecker(unityValidate(data[0], data))(data[0])
          // );
          //
          // const createIsa = _.map(data, function (d) {
          //   const arg = construct(d.id, [dynamicChecker(unityValidate(d, data))]);
          //   // console.log('arg :', arg);
          //   return dynamicIsa(arg);
          // });
          // console.log(createIsa) //id 별 각각의 isa 함수.
          // console.log(createIsa[0].toString())
          // console.log(createIsa[0](data[0]))
          // console.log(
          //   dispatch.apply(null, createIsa).toString()
          // )
          // console.log(
          //   dispatch.apply(null, createIsa)(data[0])
          // )
          //
          // function createValidateBizRepo(clientData) {
          //   const retIsa = _.map(clientData, function (d, i, a) {
          //     const arg = construct(d.id, [dynamicChecker(unityValidate(d, a))]);
          //     return dynamicIsa(arg);
          //   });
          //   return dispatch.apply(null, retIsa);
          // }

          // clientData rules 정보를 통해 실제 유효성검증함수를 만들어 조립하여 저장한다. dispatch closure함수반환.
        const validateBizRepo = createValidateBizRepo(clientData);
        // console.log(
        //   validateBizRepo.toString()
        // )
        // console.log(
        //   validateBizRepo(data[0]), validateBizRepo(data[1]), validateBizRepo(data[2])
        // )

        /**
         * 핵심 유효성검증 로직
         * clientData 기반으로 만든 유효성 저장소 함수와 clientData로 유효성검사 로직을 구성한다.
         * @type {function(*): *}
         */
        const startValidate = coreValidate(validateBizRepo);
        // console.log(
        //   startValidate(preResult)
        // );

        const start = _.compose(startValidate, validatePre);
        const result = start(clientData);
        // console.log('result :', result);

        const errors = _.find(result || [], function (obj) {
          return obj.status === 'errors';
        });

        //
        if (!existy(errors)) return true;
        console.log(errors);

        if (truthy(clientData['callback']) && _.isFunction(clientData['callback'])) {
          clientData.callback(errors);
        }
        //
        return false;
        /**
         * TODO
         * 1. 유효성 검사 후 focus 기능수준을 하나의 유효성로직에 기반하나, 하나의 요소에 기반하나? 비즈니스에 맞게 정의요구.
         * 2. isa 함수의 action 변수는 checker 함수 호출후 반환함수인데 옵션인자로 rules와
         * if (id === obj.id) {
         *  return action(obj);
         * }
         */
      };
    })
  )
);
/**
 * (주)아이브로
 * =====================================================================
 * 작성자          작성일               주석
 * =====================================================================
 * 강병훈          2022-10-24          atomy-validate 구조설계
 *
 *
 * 전체소스구조의 이해
 * 1. 설성데이터의 유효성체크(선행조건) - 정적설계
 *    핵심 함수: validatePre
 *    개발자(client)의 설정데이터(clientData)를 인자로 받아 해당소스에서 요구되는 필수 데이터를 체크한다.
 *    체크하는 부분은 하나의 대상 객체(clientData[index])의 각 키 속성 및 데이터 영역이며, 유연한 확장이 가능하도록 설계 됐다.
 * 2. 비즈니스 유효성검증 생성 - 동적설계
 *    핵심 함수: coreValidate
 *    설정데이터(clientData)를 기준으로 비즈니스 유효성검증로직을 동적생성하여 저장소에 담는다.
 *    관련로직중 유효성검증함수를 비즈니스요구사항에 따라 추가만 하면 확장가능하도록 설계 됐다.
 *
 * 3. 비즈니스 유효성검증 (핵심계산로직)
 *    핵심 함수: start(clientData)
 *    앞의 각 단계가 정상적으로 진행된 이후 유효성검증을 시작한다.
 *    _.compose 조립함수를 통해서 유효성 검증 후 후행조건 or 후처리 로직을 조립가능하도록 설계됐다.
 *
 *    결과데이터 형식: 변경 가능성 존재한다.
 *    {
 *      source: .., rules: arrays type, status: success or errors, errorMessage: arrays type
 *    }
 *
 *  간단하게 전체소스구조를 설명했고 핵심은 각 단계의 요구사항 변화에 유연한설계가 되었으므로 쉽게 확장 가능하다는것에 있다.
 *
 */










































