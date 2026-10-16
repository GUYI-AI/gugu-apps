#!/usr/bin/env node
import { createRequire as __gugu_cr } from "node:module"; const require = __gugu_cr(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/json-rpc-2.0@1.7.1/node_modules/json-rpc-2.0/dist/models.js
var require_models = __commonJS({
  "node_modules/.pnpm/json-rpc-2.0@1.7.1/node_modules/json-rpc-2.0/dist/models.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createJSONRPCNotification = exports.createJSONRPCRequest = exports.createJSONRPCSuccessResponse = exports.createJSONRPCErrorResponse = exports.JSONRPCErrorCode = exports.JSONRPCErrorException = exports.isJSONRPCResponses = exports.isJSONRPCResponse = exports.isJSONRPCRequests = exports.isJSONRPCRequest = exports.isJSONRPCID = exports.JSONRPC = void 0;
    exports.JSONRPC = "2.0";
    var isJSONRPCID = function(id) {
      return typeof id === "string" || typeof id === "number" || id === null;
    };
    exports.isJSONRPCID = isJSONRPCID;
    var isJSONRPCRequest = function(payload) {
      return payload.jsonrpc === exports.JSONRPC && payload.method !== void 0 && payload.result === void 0 && payload.error === void 0;
    };
    exports.isJSONRPCRequest = isJSONRPCRequest;
    var isJSONRPCRequests = function(payload) {
      return Array.isArray(payload) && payload.every(exports.isJSONRPCRequest);
    };
    exports.isJSONRPCRequests = isJSONRPCRequests;
    var isJSONRPCResponse = function(payload) {
      return payload.jsonrpc === exports.JSONRPC && payload.id !== void 0 && (payload.result !== void 0 || payload.error !== void 0);
    };
    exports.isJSONRPCResponse = isJSONRPCResponse;
    var isJSONRPCResponses = function(payload) {
      return Array.isArray(payload) && payload.every(exports.isJSONRPCResponse);
    };
    exports.isJSONRPCResponses = isJSONRPCResponses;
    var createJSONRPCError = function(code, message, data) {
      var error = { code, message };
      if (data != null) {
        error.data = data;
      }
      return error;
    };
    var JSONRPCErrorException3 = (
      /** @class */
      (function(_super) {
        __extends(JSONRPCErrorException4, _super);
        function JSONRPCErrorException4(message, code, data) {
          var _this = _super.call(this, message) || this;
          Object.setPrototypeOf(_this, JSONRPCErrorException4.prototype);
          _this.code = code;
          _this.data = data;
          return _this;
        }
        JSONRPCErrorException4.prototype.toObject = function() {
          return createJSONRPCError(this.code, this.message, this.data);
        };
        return JSONRPCErrorException4;
      })(Error)
    );
    exports.JSONRPCErrorException = JSONRPCErrorException3;
    var JSONRPCErrorCode;
    (function(JSONRPCErrorCode2) {
      JSONRPCErrorCode2[JSONRPCErrorCode2["ParseError"] = -32700] = "ParseError";
      JSONRPCErrorCode2[JSONRPCErrorCode2["InvalidRequest"] = -32600] = "InvalidRequest";
      JSONRPCErrorCode2[JSONRPCErrorCode2["MethodNotFound"] = -32601] = "MethodNotFound";
      JSONRPCErrorCode2[JSONRPCErrorCode2["InvalidParams"] = -32602] = "InvalidParams";
      JSONRPCErrorCode2[JSONRPCErrorCode2["InternalError"] = -32603] = "InternalError";
    })(JSONRPCErrorCode = exports.JSONRPCErrorCode || (exports.JSONRPCErrorCode = {}));
    var createJSONRPCErrorResponse2 = function(id, code, message, data) {
      return {
        jsonrpc: exports.JSONRPC,
        id,
        error: createJSONRPCError(code, message, data)
      };
    };
    exports.createJSONRPCErrorResponse = createJSONRPCErrorResponse2;
    var createJSONRPCSuccessResponse = function(id, result) {
      return {
        jsonrpc: exports.JSONRPC,
        id,
        result: result !== null && result !== void 0 ? result : null
      };
    };
    exports.createJSONRPCSuccessResponse = createJSONRPCSuccessResponse;
    var createJSONRPCRequest = function(id, method, params) {
      return {
        jsonrpc: exports.JSONRPC,
        id,
        method,
        params
      };
    };
    exports.createJSONRPCRequest = createJSONRPCRequest;
    var createJSONRPCNotification = function(method, params) {
      return {
        jsonrpc: exports.JSONRPC,
        method,
        params
      };
    };
    exports.createJSONRPCNotification = createJSONRPCNotification;
  }
});

// node_modules/.pnpm/json-rpc-2.0@1.7.1/node_modules/json-rpc-2.0/dist/internal.js
var require_internal = __commonJS({
  "node_modules/.pnpm/json-rpc-2.0@1.7.1/node_modules/json-rpc-2.0/dist/internal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultErrorCode = void 0;
    exports.DefaultErrorCode = 0;
  }
});

// node_modules/.pnpm/json-rpc-2.0@1.7.1/node_modules/json-rpc-2.0/dist/client.js
var require_client = __commonJS({
  "node_modules/.pnpm/json-rpc-2.0@1.7.1/node_modules/json-rpc-2.0/dist/client.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = exports && exports.__generator || function(thisArg, body) {
      var _ = { label: 0, sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JSONRPCClient = void 0;
    var models_1 = require_models();
    var internal_1 = require_internal();
    var JSONRPCClient2 = (
      /** @class */
      (function() {
        function JSONRPCClient3(_send, createID) {
          this._send = _send;
          this.createID = createID;
          this.idToResolveMap = /* @__PURE__ */ new Map();
          this.id = 0;
        }
        JSONRPCClient3.prototype._createID = function() {
          if (this.createID) {
            return this.createID();
          } else {
            return ++this.id;
          }
        };
        JSONRPCClient3.prototype.timeout = function(delay2, overrideCreateJSONRPCErrorResponse) {
          var _this = this;
          if (overrideCreateJSONRPCErrorResponse === void 0) {
            overrideCreateJSONRPCErrorResponse = function(id) {
              return (0, models_1.createJSONRPCErrorResponse)(id, internal_1.DefaultErrorCode, "Request timeout");
            };
          }
          var timeoutRequest = function(ids, request2) {
            var timeoutID = setTimeout(function() {
              ids.forEach(function(id) {
                var resolve = _this.idToResolveMap.get(id);
                if (resolve) {
                  _this.idToResolveMap.delete(id);
                  resolve(overrideCreateJSONRPCErrorResponse(id));
                }
              });
            }, delay2);
            return request2().then(function(result) {
              clearTimeout(timeoutID);
              return result;
            }, function(error) {
              clearTimeout(timeoutID);
              return Promise.reject(error);
            });
          };
          var requestAdvanced = function(request2, clientParams) {
            var ids = (!Array.isArray(request2) ? [request2] : request2).map(function(request3) {
              return request3.id;
            }).filter(isDefinedAndNonNull);
            return timeoutRequest(ids, function() {
              return _this.requestAdvanced(request2, clientParams);
            });
          };
          return {
            request: function(method, params, clientParams) {
              var id = _this._createID();
              return timeoutRequest([id], function() {
                return _this.requestWithID(method, params, clientParams, id);
              });
            },
            requestAdvanced: function(request2, clientParams) {
              return requestAdvanced(request2, clientParams);
            }
          };
        };
        JSONRPCClient3.prototype.request = function(method, params, clientParams) {
          return this.requestWithID(method, params, clientParams, this._createID());
        };
        JSONRPCClient3.prototype.requestWithID = function(method, params, clientParams, id) {
          return __awaiter(this, void 0, void 0, function() {
            var request2, response;
            return __generator(this, function(_a) {
              switch (_a.label) {
                case 0:
                  request2 = (0, models_1.createJSONRPCRequest)(id, method, params);
                  return [4, this.requestAdvanced(request2, clientParams)];
                case 1:
                  response = _a.sent();
                  if (response.result !== void 0 && !response.error) {
                    return [2, response.result];
                  } else if (response.result === void 0 && response.error) {
                    return [2, Promise.reject(new models_1.JSONRPCErrorException(response.error.message, response.error.code, response.error.data))];
                  } else {
                    return [2, Promise.reject(new Error("An unexpected error occurred"))];
                  }
                  return [
                    2
                    /*return*/
                  ];
              }
            });
          });
        };
        JSONRPCClient3.prototype.requestAdvanced = function(requests, clientParams) {
          var _this = this;
          var areRequestsOriginallyArray = Array.isArray(requests);
          if (!Array.isArray(requests)) {
            requests = [requests];
          }
          var requestsWithID = requests.filter(function(request2) {
            return isDefinedAndNonNull(request2.id);
          });
          var promises = requestsWithID.map(function(request2) {
            return new Promise(function(resolve) {
              return _this.idToResolveMap.set(request2.id, resolve);
            });
          });
          var promise = Promise.all(promises).then(function(responses) {
            if (areRequestsOriginallyArray || !responses.length) {
              return responses;
            } else {
              return responses[0];
            }
          });
          return this.send(areRequestsOriginallyArray ? requests : requests[0], clientParams).then(function() {
            return promise;
          }, function(error) {
            requestsWithID.forEach(function(request2) {
              _this.receive((0, models_1.createJSONRPCErrorResponse)(request2.id, internal_1.DefaultErrorCode, error && error.message || "Failed to send a request"));
            });
            return promise;
          });
        };
        JSONRPCClient3.prototype.notify = function(method, params, clientParams) {
          var request2 = (0, models_1.createJSONRPCNotification)(method, params);
          this.send(request2, clientParams).then(void 0, function() {
            return void 0;
          });
        };
        JSONRPCClient3.prototype.send = function(payload, clientParams) {
          return __awaiter(this, void 0, void 0, function() {
            return __generator(this, function(_a) {
              return [2, this._send(payload, clientParams)];
            });
          });
        };
        JSONRPCClient3.prototype.rejectAllPendingRequests = function(message) {
          this.idToResolveMap.forEach(function(resolve, id) {
            return resolve((0, models_1.createJSONRPCErrorResponse)(id, internal_1.DefaultErrorCode, message));
          });
          this.idToResolveMap.clear();
        };
        JSONRPCClient3.prototype.receive = function(responses) {
          var _this = this;
          if (!Array.isArray(responses)) {
            responses = [responses];
          }
          responses.forEach(function(response) {
            var resolve = _this.idToResolveMap.get(response.id);
            if (resolve) {
              _this.idToResolveMap.delete(response.id);
              resolve(response);
            }
          });
        };
        return JSONRPCClient3;
      })()
    );
    exports.JSONRPCClient = JSONRPCClient2;
    var isDefinedAndNonNull = function(value) {
      return value !== void 0 && value !== null;
    };
  }
});

// node_modules/.pnpm/json-rpc-2.0@1.7.1/node_modules/json-rpc-2.0/dist/interfaces.js
var require_interfaces = __commonJS({
  "node_modules/.pnpm/json-rpc-2.0@1.7.1/node_modules/json-rpc-2.0/dist/interfaces.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// node_modules/.pnpm/json-rpc-2.0@1.7.1/node_modules/json-rpc-2.0/dist/server.js
var require_server = __commonJS({
  "node_modules/.pnpm/json-rpc-2.0@1.7.1/node_modules/json-rpc-2.0/dist/server.js"(exports) {
    "use strict";
    var __assign = exports && exports.__assign || function() {
      __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = exports && exports.__generator || function(thisArg, body) {
      var _ = { label: 0, sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    var __spreadArray = exports && exports.__spreadArray || function(to, from, pack) {
      if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
      return to.concat(ar || Array.prototype.slice.call(from));
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JSONRPCServer = void 0;
    var models_1 = require_models();
    var internal_1 = require_internal();
    var createParseErrorResponse = function() {
      return (0, models_1.createJSONRPCErrorResponse)(null, models_1.JSONRPCErrorCode.ParseError, "Parse error");
    };
    var createInvalidRequestResponse = function(request2) {
      return (0, models_1.createJSONRPCErrorResponse)((0, models_1.isJSONRPCID)(request2.id) ? request2.id : null, models_1.JSONRPCErrorCode.InvalidRequest, "Invalid Request");
    };
    var createMethodNotFoundResponse = function(id) {
      return (0, models_1.createJSONRPCErrorResponse)(id, models_1.JSONRPCErrorCode.MethodNotFound, "Method not found");
    };
    var JSONRPCServer2 = (
      /** @class */
      (function() {
        function JSONRPCServer3(options) {
          if (options === void 0) {
            options = {};
          }
          var _a;
          this.mapErrorToJSONRPCErrorResponse = defaultMapErrorToJSONRPCErrorResponse;
          this.nameToMethodDictionary = {};
          this.middleware = null;
          this.errorListener = (_a = options.errorListener) !== null && _a !== void 0 ? _a : console.warn;
        }
        JSONRPCServer3.prototype.hasMethod = function(name2) {
          return !!this.nameToMethodDictionary[name2];
        };
        JSONRPCServer3.prototype.addMethod = function(name2, method) {
          this.addMethodAdvanced(name2, this.toJSONRPCMethod(method));
        };
        JSONRPCServer3.prototype.removeMethod = function(name2) {
          delete this.nameToMethodDictionary[name2];
        };
        JSONRPCServer3.prototype.toJSONRPCMethod = function(method) {
          return function(request2, serverParams) {
            var response = method(request2.params, serverParams);
            return Promise.resolve(response).then(function(result) {
              return mapResultToJSONRPCResponse(request2.id, result);
            });
          };
        };
        JSONRPCServer3.prototype.addMethodAdvanced = function(name2, method) {
          var _a;
          this.nameToMethodDictionary = __assign(__assign({}, this.nameToMethodDictionary), (_a = {}, _a[name2] = method, _a));
        };
        JSONRPCServer3.prototype.receiveJSON = function(json, serverParams) {
          var request2 = this.tryParseRequestJSON(json);
          if (request2) {
            return this.receive(request2, serverParams);
          } else {
            return Promise.resolve(createParseErrorResponse());
          }
        };
        JSONRPCServer3.prototype.tryParseRequestJSON = function(json) {
          try {
            return JSON.parse(json);
          } catch (_a) {
            return null;
          }
        };
        JSONRPCServer3.prototype.receive = function(request2, serverParams) {
          if (Array.isArray(request2)) {
            return this.receiveMultiple(request2, serverParams);
          } else {
            return this.receiveSingle(request2, serverParams);
          }
        };
        JSONRPCServer3.prototype.receiveMultiple = function(requests, serverParams) {
          return __awaiter(this, void 0, void 0, function() {
            var responses;
            var _this = this;
            return __generator(this, function(_a) {
              switch (_a.label) {
                case 0:
                  return [4, Promise.all(requests.map(function(request2) {
                    return _this.receiveSingle(request2, serverParams);
                  }))];
                case 1:
                  responses = _a.sent().filter(isNonNull);
                  if (responses.length === 1) {
                    return [2, responses[0]];
                  } else if (responses.length) {
                    return [2, responses];
                  } else {
                    return [2, null];
                  }
                  return [
                    2
                    /*return*/
                  ];
              }
            });
          });
        };
        JSONRPCServer3.prototype.receiveSingle = function(request2, serverParams) {
          return __awaiter(this, void 0, void 0, function() {
            var method, response;
            return __generator(this, function(_a) {
              switch (_a.label) {
                case 0:
                  method = this.nameToMethodDictionary[request2.method];
                  if (!!(0, models_1.isJSONRPCRequest)(request2)) return [3, 1];
                  return [2, createInvalidRequestResponse(request2)];
                case 1:
                  return [4, this.callMethod(method, request2, serverParams)];
                case 2:
                  response = _a.sent();
                  return [2, mapResponse(request2, response)];
              }
            });
          });
        };
        JSONRPCServer3.prototype.applyMiddleware = function() {
          var middlewares = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            middlewares[_i] = arguments[_i];
          }
          if (this.middleware) {
            this.middleware = this.combineMiddlewares(__spreadArray([
              this.middleware
            ], middlewares, true));
          } else {
            this.middleware = this.combineMiddlewares(middlewares);
          }
        };
        JSONRPCServer3.prototype.combineMiddlewares = function(middlewares) {
          if (!middlewares.length) {
            return null;
          } else {
            return middlewares.reduce(this.middlewareReducer);
          }
        };
        JSONRPCServer3.prototype.middlewareReducer = function(prevMiddleware, nextMiddleware) {
          return function(next, request2, serverParams) {
            return prevMiddleware(function(request3, serverParams2) {
              return nextMiddleware(next, request3, serverParams2);
            }, request2, serverParams);
          };
        };
        JSONRPCServer3.prototype.callMethod = function(method, request2, serverParams) {
          var _this = this;
          var callMethod = function(request3, serverParams2) {
            if (method) {
              return method(request3, serverParams2);
            } else if (request3.id !== void 0) {
              return Promise.resolve(createMethodNotFoundResponse(request3.id));
            } else {
              return Promise.resolve(null);
            }
          };
          var onError = function(error) {
            _this.errorListener('An unexpected error occurred while executing "'.concat(request2.method, '" JSON-RPC method:'), error);
            return Promise.resolve(_this.mapErrorToJSONRPCErrorResponseIfNecessary(request2.id, error));
          };
          try {
            return (this.middleware || noopMiddleware)(callMethod, request2, serverParams).then(void 0, onError);
          } catch (error) {
            return onError(error);
          }
        };
        JSONRPCServer3.prototype.mapErrorToJSONRPCErrorResponseIfNecessary = function(id, error) {
          if (id !== void 0) {
            return this.mapErrorToJSONRPCErrorResponse(id, error);
          } else {
            return null;
          }
        };
        return JSONRPCServer3;
      })()
    );
    exports.JSONRPCServer = JSONRPCServer2;
    var isNonNull = function(value) {
      return value !== null;
    };
    var noopMiddleware = function(next, request2, serverParams) {
      return next(request2, serverParams);
    };
    var mapResultToJSONRPCResponse = function(id, result) {
      if (id !== void 0) {
        return (0, models_1.createJSONRPCSuccessResponse)(id, result);
      } else {
        return null;
      }
    };
    var defaultMapErrorToJSONRPCErrorResponse = function(id, error) {
      var _a;
      var message = (_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : "An unexpected error occurred";
      var code = internal_1.DefaultErrorCode;
      var data;
      if (error instanceof models_1.JSONRPCErrorException) {
        code = error.code;
        data = error.data;
      }
      return (0, models_1.createJSONRPCErrorResponse)(id, code, message, data);
    };
    var mapResponse = function(request2, response) {
      if (response) {
        return response;
      } else if (request2.id !== void 0) {
        return (0, models_1.createJSONRPCErrorResponse)(request2.id, models_1.JSONRPCErrorCode.InternalError, "Internal error");
      } else {
        return null;
      }
    };
  }
});

// node_modules/.pnpm/json-rpc-2.0@1.7.1/node_modules/json-rpc-2.0/dist/server-and-client.js
var require_server_and_client = __commonJS({
  "node_modules/.pnpm/json-rpc-2.0@1.7.1/node_modules/json-rpc-2.0/dist/server-and-client.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = exports && exports.__generator || function(thisArg, body) {
      var _ = { label: 0, sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JSONRPCServerAndClient = void 0;
    var models_1 = require_models();
    var JSONRPCServerAndClient = (
      /** @class */
      (function() {
        function JSONRPCServerAndClient2(server2, client, options) {
          if (options === void 0) {
            options = {};
          }
          var _a;
          this.server = server2;
          this.client = client;
          this.errorListener = (_a = options.errorListener) !== null && _a !== void 0 ? _a : console.warn;
        }
        JSONRPCServerAndClient2.prototype.applyServerMiddleware = function() {
          var _a;
          var middlewares = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            middlewares[_i] = arguments[_i];
          }
          (_a = this.server).applyMiddleware.apply(_a, middlewares);
        };
        JSONRPCServerAndClient2.prototype.hasMethod = function(name2) {
          return this.server.hasMethod(name2);
        };
        JSONRPCServerAndClient2.prototype.addMethod = function(name2, method) {
          this.server.addMethod(name2, method);
        };
        JSONRPCServerAndClient2.prototype.addMethodAdvanced = function(name2, method) {
          this.server.addMethodAdvanced(name2, method);
        };
        JSONRPCServerAndClient2.prototype.removeMethod = function(name2) {
          this.server.removeMethod(name2);
        };
        JSONRPCServerAndClient2.prototype.timeout = function(delay2) {
          return this.client.timeout(delay2);
        };
        JSONRPCServerAndClient2.prototype.request = function(method, params, clientParams) {
          return this.client.request(method, params, clientParams);
        };
        JSONRPCServerAndClient2.prototype.requestAdvanced = function(jsonRPCRequest, clientParams) {
          return this.client.requestAdvanced(jsonRPCRequest, clientParams);
        };
        JSONRPCServerAndClient2.prototype.notify = function(method, params, clientParams) {
          this.client.notify(method, params, clientParams);
        };
        JSONRPCServerAndClient2.prototype.rejectAllPendingRequests = function(message) {
          this.client.rejectAllPendingRequests(message);
        };
        JSONRPCServerAndClient2.prototype.receiveAndSend = function(payload, serverParams, clientParams) {
          return __awaiter(this, void 0, void 0, function() {
            var response, message;
            return __generator(this, function(_a) {
              switch (_a.label) {
                case 0:
                  if (!((0, models_1.isJSONRPCResponse)(payload) || (0, models_1.isJSONRPCResponses)(payload))) return [3, 1];
                  this.client.receive(payload);
                  return [3, 4];
                case 1:
                  if (!((0, models_1.isJSONRPCRequest)(payload) || (0, models_1.isJSONRPCRequests)(payload))) return [3, 3];
                  return [4, this.server.receive(payload, serverParams)];
                case 2:
                  response = _a.sent();
                  if (response) {
                    return [2, this.client.send(response, clientParams)];
                  }
                  return [3, 4];
                case 3:
                  message = "Received an invalid JSON-RPC message";
                  this.errorListener(message, payload);
                  return [2, Promise.reject(new Error(message))];
                case 4:
                  return [
                    2
                    /*return*/
                  ];
              }
            });
          });
        };
        return JSONRPCServerAndClient2;
      })()
    );
    exports.JSONRPCServerAndClient = JSONRPCServerAndClient;
  }
});

// node_modules/.pnpm/json-rpc-2.0@1.7.1/node_modules/json-rpc-2.0/dist/index.js
var require_dist = __commonJS({
  "node_modules/.pnpm/json-rpc-2.0@1.7.1/node_modules/json-rpc-2.0/dist/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_client(), exports);
    __exportStar(require_interfaces(), exports);
    __exportStar(require_models(), exports);
    __exportStar(require_server(), exports);
    __exportStar(require_server_and_client(), exports);
  }
});

// node_modules/.pnpm/sqids@0.3.0/node_modules/sqids/esm/sqids.js
var sqids_exports = {};
__export(sqids_exports, {
  default: () => Sqids,
  defaultOptions: () => defaultOptions
});
var defaultOptions, Sqids;
var init_sqids = __esm({
  "node_modules/.pnpm/sqids@0.3.0/node_modules/sqids/esm/sqids.js"() {
    defaultOptions = {
      alphabet: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      minLength: 0,
      blocklist: /* @__PURE__ */ new Set([
        "0rgasm",
        "1d10t",
        "1d1ot",
        "1di0t",
        "1diot",
        "1eccacu10",
        "1eccacu1o",
        "1eccacul0",
        "1eccaculo",
        "1mbec11e",
        "1mbec1le",
        "1mbeci1e",
        "1mbecile",
        "a11upat0",
        "a11upato",
        "a1lupat0",
        "a1lupato",
        "aand",
        "ah01e",
        "ah0le",
        "aho1e",
        "ahole",
        "al1upat0",
        "al1upato",
        "allupat0",
        "allupato",
        "ana1",
        "ana1e",
        "anal",
        "anale",
        "anus",
        "arrapat0",
        "arrapato",
        "arsch",
        "arse",
        "ass",
        "b00b",
        "b00be",
        "b01ata",
        "b0ceta",
        "b0iata",
        "b0ob",
        "b0obe",
        "b0sta",
        "b1tch",
        "b1te",
        "b1tte",
        "ba1atkar",
        "balatkar",
        "bastard0",
        "bastardo",
        "batt0na",
        "battona",
        "bitch",
        "bite",
        "bitte",
        "bo0b",
        "bo0be",
        "bo1ata",
        "boceta",
        "boiata",
        "boob",
        "boobe",
        "bosta",
        "bran1age",
        "bran1er",
        "bran1ette",
        "bran1eur",
        "bran1euse",
        "branlage",
        "branler",
        "branlette",
        "branleur",
        "branleuse",
        "c0ck",
        "c0g110ne",
        "c0g11one",
        "c0g1i0ne",
        "c0g1ione",
        "c0gl10ne",
        "c0gl1one",
        "c0gli0ne",
        "c0glione",
        "c0na",
        "c0nnard",
        "c0nnasse",
        "c0nne",
        "c0u111es",
        "c0u11les",
        "c0u1l1es",
        "c0u1lles",
        "c0ui11es",
        "c0ui1les",
        "c0uil1es",
        "c0uilles",
        "c11t",
        "c11t0",
        "c11to",
        "c1it",
        "c1it0",
        "c1ito",
        "cabr0n",
        "cabra0",
        "cabrao",
        "cabron",
        "caca",
        "cacca",
        "cacete",
        "cagante",
        "cagar",
        "cagare",
        "cagna",
        "cara1h0",
        "cara1ho",
        "caracu10",
        "caracu1o",
        "caracul0",
        "caraculo",
        "caralh0",
        "caralho",
        "cazz0",
        "cazz1mma",
        "cazzata",
        "cazzimma",
        "cazzo",
        "ch00t1a",
        "ch00t1ya",
        "ch00tia",
        "ch00tiya",
        "ch0d",
        "ch0ot1a",
        "ch0ot1ya",
        "ch0otia",
        "ch0otiya",
        "ch1asse",
        "ch1avata",
        "ch1er",
        "ch1ng0",
        "ch1ngadaz0s",
        "ch1ngadazos",
        "ch1ngader1ta",
        "ch1ngaderita",
        "ch1ngar",
        "ch1ngo",
        "ch1ngues",
        "ch1nk",
        "chatte",
        "chiasse",
        "chiavata",
        "chier",
        "ching0",
        "chingadaz0s",
        "chingadazos",
        "chingader1ta",
        "chingaderita",
        "chingar",
        "chingo",
        "chingues",
        "chink",
        "cho0t1a",
        "cho0t1ya",
        "cho0tia",
        "cho0tiya",
        "chod",
        "choot1a",
        "choot1ya",
        "chootia",
        "chootiya",
        "cl1t",
        "cl1t0",
        "cl1to",
        "clit",
        "clit0",
        "clito",
        "cock",
        "cog110ne",
        "cog11one",
        "cog1i0ne",
        "cog1ione",
        "cogl10ne",
        "cogl1one",
        "cogli0ne",
        "coglione",
        "cona",
        "connard",
        "connasse",
        "conne",
        "cou111es",
        "cou11les",
        "cou1l1es",
        "cou1lles",
        "coui11es",
        "coui1les",
        "couil1es",
        "couilles",
        "cracker",
        "crap",
        "cu10",
        "cu1att0ne",
        "cu1attone",
        "cu1er0",
        "cu1ero",
        "cu1o",
        "cul0",
        "culatt0ne",
        "culattone",
        "culer0",
        "culero",
        "culo",
        "cum",
        "cunt",
        "d11d0",
        "d11do",
        "d1ck",
        "d1ld0",
        "d1ldo",
        "damn",
        "de1ch",
        "deich",
        "depp",
        "di1d0",
        "di1do",
        "dick",
        "dild0",
        "dildo",
        "dyke",
        "encu1e",
        "encule",
        "enema",
        "enf01re",
        "enf0ire",
        "enfo1re",
        "enfoire",
        "estup1d0",
        "estup1do",
        "estupid0",
        "estupido",
        "etr0n",
        "etron",
        "f0da",
        "f0der",
        "f0ttere",
        "f0tters1",
        "f0ttersi",
        "f0tze",
        "f0utre",
        "f1ca",
        "f1cker",
        "f1ga",
        "fag",
        "fica",
        "ficker",
        "figa",
        "foda",
        "foder",
        "fottere",
        "fotters1",
        "fottersi",
        "fotze",
        "foutre",
        "fr0c10",
        "fr0c1o",
        "fr0ci0",
        "fr0cio",
        "fr0sc10",
        "fr0sc1o",
        "fr0sci0",
        "fr0scio",
        "froc10",
        "froc1o",
        "froci0",
        "frocio",
        "frosc10",
        "frosc1o",
        "frosci0",
        "froscio",
        "fuck",
        "g00",
        "g0o",
        "g0u1ne",
        "g0uine",
        "gandu",
        "go0",
        "goo",
        "gou1ne",
        "gouine",
        "gr0gnasse",
        "grognasse",
        "haram1",
        "harami",
        "haramzade",
        "hund1n",
        "hundin",
        "id10t",
        "id1ot",
        "idi0t",
        "idiot",
        "imbec11e",
        "imbec1le",
        "imbeci1e",
        "imbecile",
        "j1zz",
        "jerk",
        "jizz",
        "k1ke",
        "kam1ne",
        "kamine",
        "kike",
        "leccacu10",
        "leccacu1o",
        "leccacul0",
        "leccaculo",
        "m1erda",
        "m1gn0tta",
        "m1gnotta",
        "m1nch1a",
        "m1nchia",
        "m1st",
        "mam0n",
        "mamahuev0",
        "mamahuevo",
        "mamon",
        "masturbat10n",
        "masturbat1on",
        "masturbate",
        "masturbati0n",
        "masturbation",
        "merd0s0",
        "merd0so",
        "merda",
        "merde",
        "merdos0",
        "merdoso",
        "mierda",
        "mign0tta",
        "mignotta",
        "minch1a",
        "minchia",
        "mist",
        "musch1",
        "muschi",
        "n1gger",
        "neger",
        "negr0",
        "negre",
        "negro",
        "nerch1a",
        "nerchia",
        "nigger",
        "orgasm",
        "p00p",
        "p011a",
        "p01la",
        "p0l1a",
        "p0lla",
        "p0mp1n0",
        "p0mp1no",
        "p0mpin0",
        "p0mpino",
        "p0op",
        "p0rca",
        "p0rn",
        "p0rra",
        "p0uff1asse",
        "p0uffiasse",
        "p1p1",
        "p1pi",
        "p1r1a",
        "p1rla",
        "p1sc10",
        "p1sc1o",
        "p1sci0",
        "p1scio",
        "p1sser",
        "pa11e",
        "pa1le",
        "pal1e",
        "palle",
        "pane1e1r0",
        "pane1e1ro",
        "pane1eir0",
        "pane1eiro",
        "panele1r0",
        "panele1ro",
        "paneleir0",
        "paneleiro",
        "patakha",
        "pec0r1na",
        "pec0rina",
        "pecor1na",
        "pecorina",
        "pen1s",
        "pendej0",
        "pendejo",
        "penis",
        "pip1",
        "pipi",
        "pir1a",
        "pirla",
        "pisc10",
        "pisc1o",
        "pisci0",
        "piscio",
        "pisser",
        "po0p",
        "po11a",
        "po1la",
        "pol1a",
        "polla",
        "pomp1n0",
        "pomp1no",
        "pompin0",
        "pompino",
        "poop",
        "porca",
        "porn",
        "porra",
        "pouff1asse",
        "pouffiasse",
        "pr1ck",
        "prick",
        "pussy",
        "put1za",
        "puta",
        "puta1n",
        "putain",
        "pute",
        "putiza",
        "puttana",
        "queca",
        "r0mp1ba11e",
        "r0mp1ba1le",
        "r0mp1bal1e",
        "r0mp1balle",
        "r0mpiba11e",
        "r0mpiba1le",
        "r0mpibal1e",
        "r0mpiballe",
        "rand1",
        "randi",
        "rape",
        "recch10ne",
        "recch1one",
        "recchi0ne",
        "recchione",
        "retard",
        "romp1ba11e",
        "romp1ba1le",
        "romp1bal1e",
        "romp1balle",
        "rompiba11e",
        "rompiba1le",
        "rompibal1e",
        "rompiballe",
        "ruff1an0",
        "ruff1ano",
        "ruffian0",
        "ruffiano",
        "s1ut",
        "sa10pe",
        "sa1aud",
        "sa1ope",
        "sacanagem",
        "sal0pe",
        "salaud",
        "salope",
        "saugnapf",
        "sb0rr0ne",
        "sb0rra",
        "sb0rrone",
        "sbattere",
        "sbatters1",
        "sbattersi",
        "sborr0ne",
        "sborra",
        "sborrone",
        "sc0pare",
        "sc0pata",
        "sch1ampe",
        "sche1se",
        "sche1sse",
        "scheise",
        "scheisse",
        "schlampe",
        "schwachs1nn1g",
        "schwachs1nnig",
        "schwachsinn1g",
        "schwachsinnig",
        "schwanz",
        "scopare",
        "scopata",
        "sexy",
        "sh1t",
        "shit",
        "slut",
        "sp0mp1nare",
        "sp0mpinare",
        "spomp1nare",
        "spompinare",
        "str0nz0",
        "str0nza",
        "str0nzo",
        "stronz0",
        "stronza",
        "stronzo",
        "stup1d",
        "stupid",
        "succh1am1",
        "succh1ami",
        "succhiam1",
        "succhiami",
        "sucker",
        "t0pa",
        "tapette",
        "test1c1e",
        "test1cle",
        "testic1e",
        "testicle",
        "tette",
        "topa",
        "tr01a",
        "tr0ia",
        "tr0mbare",
        "tr1ng1er",
        "tr1ngler",
        "tring1er",
        "tringler",
        "tro1a",
        "troia",
        "trombare",
        "turd",
        "twat",
        "vaffancu10",
        "vaffancu1o",
        "vaffancul0",
        "vaffanculo",
        "vag1na",
        "vagina",
        "verdammt",
        "verga",
        "w1chsen",
        "wank",
        "wichsen",
        "x0ch0ta",
        "x0chota",
        "xana",
        "xoch0ta",
        "xochota",
        "z0cc01a",
        "z0cc0la",
        "z0cco1a",
        "z0ccola",
        "z1z1",
        "z1zi",
        "ziz1",
        "zizi",
        "zocc01a",
        "zocc0la",
        "zocco1a",
        "zoccola"
      ])
    };
    Sqids = class {
      constructor(options) {
        var _a, _b, _c;
        const alphabet = (_a = options === null || options === void 0 ? void 0 : options.alphabet) !== null && _a !== void 0 ? _a : defaultOptions.alphabet;
        const minLength2 = (_b = options === null || options === void 0 ? void 0 : options.minLength) !== null && _b !== void 0 ? _b : defaultOptions.minLength;
        const blocklist = (_c = options === null || options === void 0 ? void 0 : options.blocklist) !== null && _c !== void 0 ? _c : defaultOptions.blocklist;
        if (new Blob([alphabet]).size !== alphabet.length) {
          throw new Error("Alphabet cannot contain multibyte characters");
        }
        const minAlphabetLength = 3;
        if (alphabet.length < minAlphabetLength) {
          throw new Error(`Alphabet length must be at least ${minAlphabetLength}`);
        }
        if (new Set(alphabet).size !== alphabet.length) {
          throw new Error("Alphabet must contain unique characters");
        }
        const minLengthLimit = 255;
        if (typeof minLength2 !== "number" || minLength2 < 0 || minLength2 > minLengthLimit) {
          throw new Error(`Minimum length has to be between 0 and ${minLengthLimit}`);
        }
        const filteredBlocklist = /* @__PURE__ */ new Set();
        const alphabetChars = alphabet.toLowerCase().split("");
        for (const word of blocklist) {
          if (word.length >= 3) {
            const wordLowercased = word.toLowerCase();
            const wordChars = wordLowercased.split("");
            const intersection = wordChars.filter((c) => alphabetChars.includes(c));
            if (intersection.length === wordChars.length) {
              filteredBlocklist.add(wordLowercased);
            }
          }
        }
        this.alphabet = this.shuffle(alphabet);
        this.minLength = minLength2;
        this.blocklist = filteredBlocklist;
      }
      encode(numbers) {
        if (numbers.length === 0) {
          return "";
        }
        const inRangeNumbers = numbers.filter((n) => n >= 0 && n <= this.maxValue());
        if (inRangeNumbers.length !== numbers.length) {
          throw new Error(`Encoding supports numbers between 0 and ${this.maxValue()}`);
        }
        return this.encodeNumbers(numbers);
      }
      decode(id) {
        const ret = [];
        if (id === "") {
          return ret;
        }
        const alphabetChars = this.alphabet.split("");
        for (const c of id.split("")) {
          if (!alphabetChars.includes(c)) {
            return ret;
          }
        }
        const prefix = id.charAt(0);
        const offset = this.alphabet.indexOf(prefix);
        let alphabet = this.alphabet.slice(offset) + this.alphabet.slice(0, offset);
        alphabet = alphabet.split("").reverse().join("");
        let slicedId = id.slice(1);
        while (slicedId.length > 0) {
          const separator = alphabet.slice(0, 1);
          const chunks = slicedId.split(separator);
          if (chunks.length > 0) {
            if (chunks[0] === "") {
              return ret;
            }
            ret.push(this.toNumber(chunks[0], alphabet.slice(1)));
            if (chunks.length > 1) {
              alphabet = this.shuffle(alphabet);
            }
          }
          slicedId = chunks.slice(1).join(separator);
        }
        return ret;
      }
      encodeNumbers(numbers, increment = 0) {
        if (increment > this.alphabet.length) {
          throw new Error("Reached max attempts to re-generate the ID");
        }
        let offset = numbers.reduce((a, v, i) => this.alphabet[v % this.alphabet.length].codePointAt(0) + i + a, numbers.length) % this.alphabet.length;
        offset = (offset + increment) % this.alphabet.length;
        let alphabet = this.alphabet.slice(offset) + this.alphabet.slice(0, offset);
        const prefix = alphabet.charAt(0);
        alphabet = alphabet.split("").reverse().join("");
        const ret = [prefix];
        for (let i = 0; i !== numbers.length; i++) {
          const num = numbers[i];
          ret.push(this.toId(num, alphabet.slice(1)));
          if (i < numbers.length - 1) {
            ret.push(alphabet.slice(0, 1));
            alphabet = this.shuffle(alphabet);
          }
        }
        let id = ret.join("");
        if (this.minLength > id.length) {
          id += alphabet.slice(0, 1);
          while (this.minLength - id.length > 0) {
            alphabet = this.shuffle(alphabet);
            id += alphabet.slice(0, Math.min(this.minLength - id.length, alphabet.length));
          }
        }
        if (this.isBlockedId(id)) {
          id = this.encodeNumbers(numbers, increment + 1);
        }
        return id;
      }
      shuffle(alphabet) {
        const chars = alphabet.split("");
        for (let i = 0, j = chars.length - 1; j > 0; i++, j--) {
          const r = (i * j + chars[i].codePointAt(0) + chars[j].codePointAt(0)) % chars.length;
          [chars[i], chars[r]] = [chars[r], chars[i]];
        }
        return chars.join("");
      }
      toId(num, alphabet) {
        const id = [];
        const chars = alphabet.split("");
        let result = num;
        do {
          id.unshift(chars[result % chars.length]);
          result = Math.floor(result / chars.length);
        } while (result > 0);
        return id.join("");
      }
      toNumber(id, alphabet) {
        const chars = alphabet.split("");
        return id.split("").reduce((a, v) => a * chars.length + chars.indexOf(v), 0);
      }
      isBlockedId(id) {
        const lowercaseId = id.toLowerCase();
        for (const word of this.blocklist) {
          if (word.length <= lowercaseId.length) {
            if (lowercaseId.length <= 3 || word.length <= 3) {
              if (lowercaseId === word) {
                return true;
              }
            } else if (/\d/.test(word)) {
              if (lowercaseId.startsWith(word) || lowercaseId.endsWith(word)) {
                return true;
              }
            } else if (lowercaseId.includes(word)) {
              return true;
            }
          }
        }
        return false;
      }
      maxValue() {
        return Number.MAX_SAFE_INTEGER;
      }
    };
  }
});

// node_modules/.pnpm/fast-content-type-parse@3.0.0/node_modules/fast-content-type-parse/index.js
var require_fast_content_type_parse = __commonJS({
  "node_modules/.pnpm/fast-content-type-parse@3.0.0/node_modules/fast-content-type-parse/index.js"(exports, module) {
    "use strict";
    var NullObject = function NullObject2() {
    };
    NullObject.prototype = /* @__PURE__ */ Object.create(null);
    var paramRE = /; *([!#$%&'*+.^\w`|~-]+)=("(?:[\v\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\v\u0020-\u00ff])*"|[!#$%&'*+.^\w`|~-]+) */gu;
    var quotedPairRE = /\\([\v\u0020-\u00ff])/gu;
    var mediaTypeRE = /^[!#$%&'*+.^\w|~-]+\/[!#$%&'*+.^\w|~-]+$/u;
    var defaultContentType = { type: "", parameters: new NullObject() };
    Object.freeze(defaultContentType.parameters);
    Object.freeze(defaultContentType);
    function parse3(header) {
      if (typeof header !== "string") {
        throw new TypeError("argument header is required and must be a string");
      }
      let index = header.indexOf(";");
      const type = index !== -1 ? header.slice(0, index).trim() : header.trim();
      if (mediaTypeRE.test(type) === false) {
        throw new TypeError("invalid media type");
      }
      const result = {
        type: type.toLowerCase(),
        parameters: new NullObject()
      };
      if (index === -1) {
        return result;
      }
      let key;
      let match;
      let value;
      paramRE.lastIndex = index;
      while (match = paramRE.exec(header)) {
        if (match.index !== index) {
          throw new TypeError("invalid parameter format");
        }
        index += match[0].length;
        key = match[1].toLowerCase();
        value = match[2];
        if (value[0] === '"') {
          value = value.slice(1, value.length - 1);
          quotedPairRE.test(value) && (value = value.replace(quotedPairRE, "$1"));
        }
        result.parameters[key] = value;
      }
      if (index !== header.length) {
        throw new TypeError("invalid parameter format");
      }
      return result;
    }
    function safeParse3(header) {
      if (typeof header !== "string") {
        return defaultContentType;
      }
      let index = header.indexOf(";");
      const type = index !== -1 ? header.slice(0, index).trim() : header.trim();
      if (mediaTypeRE.test(type) === false) {
        return defaultContentType;
      }
      const result = {
        type: type.toLowerCase(),
        parameters: new NullObject()
      };
      if (index === -1) {
        return result;
      }
      let key;
      let match;
      let value;
      paramRE.lastIndex = index;
      while (match = paramRE.exec(header)) {
        if (match.index !== index) {
          return defaultContentType;
        }
        index += match[0].length;
        key = match[1].toLowerCase();
        value = match[2];
        if (value[0] === '"') {
          value = value.slice(1, value.length - 1);
          quotedPairRE.test(value) && (value = value.replace(quotedPairRE, "$1"));
        }
        result.parameters[key] = value;
      }
      if (index !== header.length) {
        return defaultContentType;
      }
      return result;
    }
    module.exports.default = { parse: parse3, safeParse: safeParse3 };
    module.exports.parse = parse3;
    module.exports.safeParse = safeParse3;
    module.exports.defaultContentType = defaultContentType;
  }
});

// node_modules/.pnpm/bottleneck@2.19.5/node_modules/bottleneck/light.js
var require_light = __commonJS({
  "node_modules/.pnpm/bottleneck@2.19.5/node_modules/bottleneck/light.js"(exports, module) {
    (function(global2, factory) {
      typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : global2.Bottleneck = factory();
    })(exports, (function() {
      "use strict";
      var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
      function getCjsExportFromNamespace(n) {
        return n && n["default"] || n;
      }
      var load = function(received, defaults, onto = {}) {
        var k, ref, v;
        for (k in defaults) {
          v = defaults[k];
          onto[k] = (ref = received[k]) != null ? ref : v;
        }
        return onto;
      };
      var overwrite = function(received, defaults, onto = {}) {
        var k, v;
        for (k in received) {
          v = received[k];
          if (defaults[k] !== void 0) {
            onto[k] = v;
          }
        }
        return onto;
      };
      var parser = {
        load,
        overwrite
      };
      var DLList;
      DLList = class DLList {
        constructor(incr, decr) {
          this.incr = incr;
          this.decr = decr;
          this._first = null;
          this._last = null;
          this.length = 0;
        }
        push(value) {
          var node;
          this.length++;
          if (typeof this.incr === "function") {
            this.incr();
          }
          node = {
            value,
            prev: this._last,
            next: null
          };
          if (this._last != null) {
            this._last.next = node;
            this._last = node;
          } else {
            this._first = this._last = node;
          }
          return void 0;
        }
        shift() {
          var value;
          if (this._first == null) {
            return;
          } else {
            this.length--;
            if (typeof this.decr === "function") {
              this.decr();
            }
          }
          value = this._first.value;
          if ((this._first = this._first.next) != null) {
            this._first.prev = null;
          } else {
            this._last = null;
          }
          return value;
        }
        first() {
          if (this._first != null) {
            return this._first.value;
          }
        }
        getArray() {
          var node, ref, results;
          node = this._first;
          results = [];
          while (node != null) {
            results.push((ref = node, node = node.next, ref.value));
          }
          return results;
        }
        forEachShift(cb) {
          var node;
          node = this.shift();
          while (node != null) {
            cb(node), node = this.shift();
          }
          return void 0;
        }
        debug() {
          var node, ref, ref1, ref2, results;
          node = this._first;
          results = [];
          while (node != null) {
            results.push((ref = node, node = node.next, {
              value: ref.value,
              prev: (ref1 = ref.prev) != null ? ref1.value : void 0,
              next: (ref2 = ref.next) != null ? ref2.value : void 0
            }));
          }
          return results;
        }
      };
      var DLList_1 = DLList;
      var Events;
      Events = class Events {
        constructor(instance) {
          this.instance = instance;
          this._events = {};
          if (this.instance.on != null || this.instance.once != null || this.instance.removeAllListeners != null) {
            throw new Error("An Emitter already exists for this object");
          }
          this.instance.on = (name2, cb) => {
            return this._addListener(name2, "many", cb);
          };
          this.instance.once = (name2, cb) => {
            return this._addListener(name2, "once", cb);
          };
          this.instance.removeAllListeners = (name2 = null) => {
            if (name2 != null) {
              return delete this._events[name2];
            } else {
              return this._events = {};
            }
          };
        }
        _addListener(name2, status, cb) {
          var base;
          if ((base = this._events)[name2] == null) {
            base[name2] = [];
          }
          this._events[name2].push({ cb, status });
          return this.instance;
        }
        listenerCount(name2) {
          if (this._events[name2] != null) {
            return this._events[name2].length;
          } else {
            return 0;
          }
        }
        async trigger(name2, ...args) {
          var e, promises;
          try {
            if (name2 !== "debug") {
              this.trigger("debug", `Event triggered: ${name2}`, args);
            }
            if (this._events[name2] == null) {
              return;
            }
            this._events[name2] = this._events[name2].filter(function(listener) {
              return listener.status !== "none";
            });
            promises = this._events[name2].map(async (listener) => {
              var e2, returned;
              if (listener.status === "none") {
                return;
              }
              if (listener.status === "once") {
                listener.status = "none";
              }
              try {
                returned = typeof listener.cb === "function" ? listener.cb(...args) : void 0;
                if (typeof (returned != null ? returned.then : void 0) === "function") {
                  return await returned;
                } else {
                  return returned;
                }
              } catch (error) {
                e2 = error;
                {
                  this.trigger("error", e2);
                }
                return null;
              }
            });
            return (await Promise.all(promises)).find(function(x) {
              return x != null;
            });
          } catch (error) {
            e = error;
            {
              this.trigger("error", e);
            }
            return null;
          }
        }
      };
      var Events_1 = Events;
      var DLList$1, Events$1, Queues;
      DLList$1 = DLList_1;
      Events$1 = Events_1;
      Queues = class Queues {
        constructor(num_priorities) {
          var i;
          this.Events = new Events$1(this);
          this._length = 0;
          this._lists = (function() {
            var j, ref, results;
            results = [];
            for (i = j = 1, ref = num_priorities; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
              results.push(new DLList$1((() => {
                return this.incr();
              }), (() => {
                return this.decr();
              })));
            }
            return results;
          }).call(this);
        }
        incr() {
          if (this._length++ === 0) {
            return this.Events.trigger("leftzero");
          }
        }
        decr() {
          if (--this._length === 0) {
            return this.Events.trigger("zero");
          }
        }
        push(job) {
          return this._lists[job.options.priority].push(job);
        }
        queued(priority) {
          if (priority != null) {
            return this._lists[priority].length;
          } else {
            return this._length;
          }
        }
        shiftAll(fn) {
          return this._lists.forEach(function(list) {
            return list.forEachShift(fn);
          });
        }
        getFirst(arr = this._lists) {
          var j, len, list;
          for (j = 0, len = arr.length; j < len; j++) {
            list = arr[j];
            if (list.length > 0) {
              return list;
            }
          }
          return [];
        }
        shiftLastFrom(priority) {
          return this.getFirst(this._lists.slice(priority).reverse()).shift();
        }
      };
      var Queues_1 = Queues;
      var BottleneckError;
      BottleneckError = class BottleneckError extends Error {
      };
      var BottleneckError_1 = BottleneckError;
      var BottleneckError$1, DEFAULT_PRIORITY, Job, NUM_PRIORITIES, parser$1;
      NUM_PRIORITIES = 10;
      DEFAULT_PRIORITY = 5;
      parser$1 = parser;
      BottleneckError$1 = BottleneckError_1;
      Job = class Job {
        constructor(task, args, options, jobDefaults, rejectOnDrop, Events2, _states, Promise2) {
          this.task = task;
          this.args = args;
          this.rejectOnDrop = rejectOnDrop;
          this.Events = Events2;
          this._states = _states;
          this.Promise = Promise2;
          this.options = parser$1.load(options, jobDefaults);
          this.options.priority = this._sanitizePriority(this.options.priority);
          if (this.options.id === jobDefaults.id) {
            this.options.id = `${this.options.id}-${this._randomIndex()}`;
          }
          this.promise = new this.Promise((_resolve, _reject) => {
            this._resolve = _resolve;
            this._reject = _reject;
          });
          this.retryCount = 0;
        }
        _sanitizePriority(priority) {
          var sProperty;
          sProperty = ~~priority !== priority ? DEFAULT_PRIORITY : priority;
          if (sProperty < 0) {
            return 0;
          } else if (sProperty > NUM_PRIORITIES - 1) {
            return NUM_PRIORITIES - 1;
          } else {
            return sProperty;
          }
        }
        _randomIndex() {
          return Math.random().toString(36).slice(2);
        }
        doDrop({ error, message = "This job has been dropped by Bottleneck" } = {}) {
          if (this._states.remove(this.options.id)) {
            if (this.rejectOnDrop) {
              this._reject(error != null ? error : new BottleneckError$1(message));
            }
            this.Events.trigger("dropped", { args: this.args, options: this.options, task: this.task, promise: this.promise });
            return true;
          } else {
            return false;
          }
        }
        _assertStatus(expected) {
          var status;
          status = this._states.jobStatus(this.options.id);
          if (!(status === expected || expected === "DONE" && status === null)) {
            throw new BottleneckError$1(`Invalid job status ${status}, expected ${expected}. Please open an issue at https://github.com/SGrondin/bottleneck/issues`);
          }
        }
        doReceive() {
          this._states.start(this.options.id);
          return this.Events.trigger("received", { args: this.args, options: this.options });
        }
        doQueue(reachedHWM, blocked) {
          this._assertStatus("RECEIVED");
          this._states.next(this.options.id);
          return this.Events.trigger("queued", { args: this.args, options: this.options, reachedHWM, blocked });
        }
        doRun() {
          if (this.retryCount === 0) {
            this._assertStatus("QUEUED");
            this._states.next(this.options.id);
          } else {
            this._assertStatus("EXECUTING");
          }
          return this.Events.trigger("scheduled", { args: this.args, options: this.options });
        }
        async doExecute(chained, clearGlobalState, run, free) {
          var error, eventInfo, passed;
          if (this.retryCount === 0) {
            this._assertStatus("RUNNING");
            this._states.next(this.options.id);
          } else {
            this._assertStatus("EXECUTING");
          }
          eventInfo = { args: this.args, options: this.options, retryCount: this.retryCount };
          this.Events.trigger("executing", eventInfo);
          try {
            passed = await (chained != null ? chained.schedule(this.options, this.task, ...this.args) : this.task(...this.args));
            if (clearGlobalState()) {
              this.doDone(eventInfo);
              await free(this.options, eventInfo);
              this._assertStatus("DONE");
              return this._resolve(passed);
            }
          } catch (error1) {
            error = error1;
            return this._onFailure(error, eventInfo, clearGlobalState, run, free);
          }
        }
        doExpire(clearGlobalState, run, free) {
          var error, eventInfo;
          if (this._states.jobStatus(this.options.id === "RUNNING")) {
            this._states.next(this.options.id);
          }
          this._assertStatus("EXECUTING");
          eventInfo = { args: this.args, options: this.options, retryCount: this.retryCount };
          error = new BottleneckError$1(`This job timed out after ${this.options.expiration} ms.`);
          return this._onFailure(error, eventInfo, clearGlobalState, run, free);
        }
        async _onFailure(error, eventInfo, clearGlobalState, run, free) {
          var retry2, retryAfter;
          if (clearGlobalState()) {
            retry2 = await this.Events.trigger("failed", error, eventInfo);
            if (retry2 != null) {
              retryAfter = ~~retry2;
              this.Events.trigger("retry", `Retrying ${this.options.id} after ${retryAfter} ms`, eventInfo);
              this.retryCount++;
              return run(retryAfter);
            } else {
              this.doDone(eventInfo);
              await free(this.options, eventInfo);
              this._assertStatus("DONE");
              return this._reject(error);
            }
          }
        }
        doDone(eventInfo) {
          this._assertStatus("EXECUTING");
          this._states.next(this.options.id);
          return this.Events.trigger("done", eventInfo);
        }
      };
      var Job_1 = Job;
      var BottleneckError$2, LocalDatastore, parser$2;
      parser$2 = parser;
      BottleneckError$2 = BottleneckError_1;
      LocalDatastore = class LocalDatastore {
        constructor(instance, storeOptions, storeInstanceOptions) {
          this.instance = instance;
          this.storeOptions = storeOptions;
          this.clientId = this.instance._randomIndex();
          parser$2.load(storeInstanceOptions, storeInstanceOptions, this);
          this._nextRequest = this._lastReservoirRefresh = this._lastReservoirIncrease = Date.now();
          this._running = 0;
          this._done = 0;
          this._unblockTime = 0;
          this.ready = this.Promise.resolve();
          this.clients = {};
          this._startHeartbeat();
        }
        _startHeartbeat() {
          var base;
          if (this.heartbeat == null && (this.storeOptions.reservoirRefreshInterval != null && this.storeOptions.reservoirRefreshAmount != null || this.storeOptions.reservoirIncreaseInterval != null && this.storeOptions.reservoirIncreaseAmount != null)) {
            return typeof (base = this.heartbeat = setInterval(() => {
              var amount, incr, maximum, now, reservoir;
              now = Date.now();
              if (this.storeOptions.reservoirRefreshInterval != null && now >= this._lastReservoirRefresh + this.storeOptions.reservoirRefreshInterval) {
                this._lastReservoirRefresh = now;
                this.storeOptions.reservoir = this.storeOptions.reservoirRefreshAmount;
                this.instance._drainAll(this.computeCapacity());
              }
              if (this.storeOptions.reservoirIncreaseInterval != null && now >= this._lastReservoirIncrease + this.storeOptions.reservoirIncreaseInterval) {
                ({
                  reservoirIncreaseAmount: amount,
                  reservoirIncreaseMaximum: maximum,
                  reservoir
                } = this.storeOptions);
                this._lastReservoirIncrease = now;
                incr = maximum != null ? Math.min(amount, maximum - reservoir) : amount;
                if (incr > 0) {
                  this.storeOptions.reservoir += incr;
                  return this.instance._drainAll(this.computeCapacity());
                }
              }
            }, this.heartbeatInterval)).unref === "function" ? base.unref() : void 0;
          } else {
            return clearInterval(this.heartbeat);
          }
        }
        async __publish__(message) {
          await this.yieldLoop();
          return this.instance.Events.trigger("message", message.toString());
        }
        async __disconnect__(flush) {
          await this.yieldLoop();
          clearInterval(this.heartbeat);
          return this.Promise.resolve();
        }
        yieldLoop(t = 0) {
          return new this.Promise(function(resolve, reject) {
            return setTimeout(resolve, t);
          });
        }
        computePenalty() {
          var ref;
          return (ref = this.storeOptions.penalty) != null ? ref : 15 * this.storeOptions.minTime || 5e3;
        }
        async __updateSettings__(options) {
          await this.yieldLoop();
          parser$2.overwrite(options, options, this.storeOptions);
          this._startHeartbeat();
          this.instance._drainAll(this.computeCapacity());
          return true;
        }
        async __running__() {
          await this.yieldLoop();
          return this._running;
        }
        async __queued__() {
          await this.yieldLoop();
          return this.instance.queued();
        }
        async __done__() {
          await this.yieldLoop();
          return this._done;
        }
        async __groupCheck__(time) {
          await this.yieldLoop();
          return this._nextRequest + this.timeout < time;
        }
        computeCapacity() {
          var maxConcurrent, reservoir;
          ({ maxConcurrent, reservoir } = this.storeOptions);
          if (maxConcurrent != null && reservoir != null) {
            return Math.min(maxConcurrent - this._running, reservoir);
          } else if (maxConcurrent != null) {
            return maxConcurrent - this._running;
          } else if (reservoir != null) {
            return reservoir;
          } else {
            return null;
          }
        }
        conditionsCheck(weight) {
          var capacity;
          capacity = this.computeCapacity();
          return capacity == null || weight <= capacity;
        }
        async __incrementReservoir__(incr) {
          var reservoir;
          await this.yieldLoop();
          reservoir = this.storeOptions.reservoir += incr;
          this.instance._drainAll(this.computeCapacity());
          return reservoir;
        }
        async __currentReservoir__() {
          await this.yieldLoop();
          return this.storeOptions.reservoir;
        }
        isBlocked(now) {
          return this._unblockTime >= now;
        }
        check(weight, now) {
          return this.conditionsCheck(weight) && this._nextRequest - now <= 0;
        }
        async __check__(weight) {
          var now;
          await this.yieldLoop();
          now = Date.now();
          return this.check(weight, now);
        }
        async __register__(index, weight, expiration) {
          var now, wait2;
          await this.yieldLoop();
          now = Date.now();
          if (this.conditionsCheck(weight)) {
            this._running += weight;
            if (this.storeOptions.reservoir != null) {
              this.storeOptions.reservoir -= weight;
            }
            wait2 = Math.max(this._nextRequest - now, 0);
            this._nextRequest = now + wait2 + this.storeOptions.minTime;
            return {
              success: true,
              wait: wait2,
              reservoir: this.storeOptions.reservoir
            };
          } else {
            return {
              success: false
            };
          }
        }
        strategyIsBlock() {
          return this.storeOptions.strategy === 3;
        }
        async __submit__(queueLength, weight) {
          var blocked, now, reachedHWM;
          await this.yieldLoop();
          if (this.storeOptions.maxConcurrent != null && weight > this.storeOptions.maxConcurrent) {
            throw new BottleneckError$2(`Impossible to add a job having a weight of ${weight} to a limiter having a maxConcurrent setting of ${this.storeOptions.maxConcurrent}`);
          }
          now = Date.now();
          reachedHWM = this.storeOptions.highWater != null && queueLength === this.storeOptions.highWater && !this.check(weight, now);
          blocked = this.strategyIsBlock() && (reachedHWM || this.isBlocked(now));
          if (blocked) {
            this._unblockTime = now + this.computePenalty();
            this._nextRequest = this._unblockTime + this.storeOptions.minTime;
            this.instance._dropAllQueued();
          }
          return {
            reachedHWM,
            blocked,
            strategy: this.storeOptions.strategy
          };
        }
        async __free__(index, weight) {
          await this.yieldLoop();
          this._running -= weight;
          this._done += weight;
          this.instance._drainAll(this.computeCapacity());
          return {
            running: this._running
          };
        }
      };
      var LocalDatastore_1 = LocalDatastore;
      var BottleneckError$3, States;
      BottleneckError$3 = BottleneckError_1;
      States = class States {
        constructor(status1) {
          this.status = status1;
          this._jobs = {};
          this.counts = this.status.map(function() {
            return 0;
          });
        }
        next(id) {
          var current, next;
          current = this._jobs[id];
          next = current + 1;
          if (current != null && next < this.status.length) {
            this.counts[current]--;
            this.counts[next]++;
            return this._jobs[id]++;
          } else if (current != null) {
            this.counts[current]--;
            return delete this._jobs[id];
          }
        }
        start(id) {
          var initial;
          initial = 0;
          this._jobs[id] = initial;
          return this.counts[initial]++;
        }
        remove(id) {
          var current;
          current = this._jobs[id];
          if (current != null) {
            this.counts[current]--;
            delete this._jobs[id];
          }
          return current != null;
        }
        jobStatus(id) {
          var ref;
          return (ref = this.status[this._jobs[id]]) != null ? ref : null;
        }
        statusJobs(status) {
          var k, pos, ref, results, v;
          if (status != null) {
            pos = this.status.indexOf(status);
            if (pos < 0) {
              throw new BottleneckError$3(`status must be one of ${this.status.join(", ")}`);
            }
            ref = this._jobs;
            results = [];
            for (k in ref) {
              v = ref[k];
              if (v === pos) {
                results.push(k);
              }
            }
            return results;
          } else {
            return Object.keys(this._jobs);
          }
        }
        statusCounts() {
          return this.counts.reduce(((acc, v, i) => {
            acc[this.status[i]] = v;
            return acc;
          }), {});
        }
      };
      var States_1 = States;
      var DLList$2, Sync;
      DLList$2 = DLList_1;
      Sync = class Sync {
        constructor(name2, Promise2) {
          this.schedule = this.schedule.bind(this);
          this.name = name2;
          this.Promise = Promise2;
          this._running = 0;
          this._queue = new DLList$2();
        }
        isEmpty() {
          return this._queue.length === 0;
        }
        async _tryToRun() {
          var args, cb, error, reject, resolve, returned, task;
          if (this._running < 1 && this._queue.length > 0) {
            this._running++;
            ({ task, args, resolve, reject } = this._queue.shift());
            cb = await (async function() {
              try {
                returned = await task(...args);
                return function() {
                  return resolve(returned);
                };
              } catch (error1) {
                error = error1;
                return function() {
                  return reject(error);
                };
              }
            })();
            this._running--;
            this._tryToRun();
            return cb();
          }
        }
        schedule(task, ...args) {
          var promise, reject, resolve;
          resolve = reject = null;
          promise = new this.Promise(function(_resolve, _reject) {
            resolve = _resolve;
            return reject = _reject;
          });
          this._queue.push({ task, args, resolve, reject });
          this._tryToRun();
          return promise;
        }
      };
      var Sync_1 = Sync;
      var version2 = "2.19.5";
      var version$1 = {
        version: version2
      };
      var version$2 = /* @__PURE__ */ Object.freeze({
        version: version2,
        default: version$1
      });
      var require$$2 = () => console.log("You must import the full version of Bottleneck in order to use this feature.");
      var require$$3 = () => console.log("You must import the full version of Bottleneck in order to use this feature.");
      var require$$4 = () => console.log("You must import the full version of Bottleneck in order to use this feature.");
      var Events$2, Group, IORedisConnection$1, RedisConnection$1, Scripts$1, parser$3;
      parser$3 = parser;
      Events$2 = Events_1;
      RedisConnection$1 = require$$2;
      IORedisConnection$1 = require$$3;
      Scripts$1 = require$$4;
      Group = (function() {
        class Group2 {
          constructor(limiterOptions = {}) {
            this.deleteKey = this.deleteKey.bind(this);
            this.limiterOptions = limiterOptions;
            parser$3.load(this.limiterOptions, this.defaults, this);
            this.Events = new Events$2(this);
            this.instances = {};
            this.Bottleneck = Bottleneck_1;
            this._startAutoCleanup();
            this.sharedConnection = this.connection != null;
            if (this.connection == null) {
              if (this.limiterOptions.datastore === "redis") {
                this.connection = new RedisConnection$1(Object.assign({}, this.limiterOptions, { Events: this.Events }));
              } else if (this.limiterOptions.datastore === "ioredis") {
                this.connection = new IORedisConnection$1(Object.assign({}, this.limiterOptions, { Events: this.Events }));
              }
            }
          }
          key(key = "") {
            var ref;
            return (ref = this.instances[key]) != null ? ref : (() => {
              var limiter;
              limiter = this.instances[key] = new this.Bottleneck(Object.assign(this.limiterOptions, {
                id: `${this.id}-${key}`,
                timeout: this.timeout,
                connection: this.connection
              }));
              this.Events.trigger("created", limiter, key);
              return limiter;
            })();
          }
          async deleteKey(key = "") {
            var deleted, instance;
            instance = this.instances[key];
            if (this.connection) {
              deleted = await this.connection.__runCommand__(["del", ...Scripts$1.allKeys(`${this.id}-${key}`)]);
            }
            if (instance != null) {
              delete this.instances[key];
              await instance.disconnect();
            }
            return instance != null || deleted > 0;
          }
          limiters() {
            var k, ref, results, v;
            ref = this.instances;
            results = [];
            for (k in ref) {
              v = ref[k];
              results.push({
                key: k,
                limiter: v
              });
            }
            return results;
          }
          keys() {
            return Object.keys(this.instances);
          }
          async clusterKeys() {
            var cursor, end, found, i, k, keys, len, next, start;
            if (this.connection == null) {
              return this.Promise.resolve(this.keys());
            }
            keys = [];
            cursor = null;
            start = `b_${this.id}-`.length;
            end = "_settings".length;
            while (cursor !== 0) {
              [next, found] = await this.connection.__runCommand__(["scan", cursor != null ? cursor : 0, "match", `b_${this.id}-*_settings`, "count", 1e4]);
              cursor = ~~next;
              for (i = 0, len = found.length; i < len; i++) {
                k = found[i];
                keys.push(k.slice(start, -end));
              }
            }
            return keys;
          }
          _startAutoCleanup() {
            var base;
            clearInterval(this.interval);
            return typeof (base = this.interval = setInterval(async () => {
              var e, k, ref, results, time, v;
              time = Date.now();
              ref = this.instances;
              results = [];
              for (k in ref) {
                v = ref[k];
                try {
                  if (await v._store.__groupCheck__(time)) {
                    results.push(this.deleteKey(k));
                  } else {
                    results.push(void 0);
                  }
                } catch (error) {
                  e = error;
                  results.push(v.Events.trigger("error", e));
                }
              }
              return results;
            }, this.timeout / 2)).unref === "function" ? base.unref() : void 0;
          }
          updateSettings(options = {}) {
            parser$3.overwrite(options, this.defaults, this);
            parser$3.overwrite(options, options, this.limiterOptions);
            if (options.timeout != null) {
              return this._startAutoCleanup();
            }
          }
          disconnect(flush = true) {
            var ref;
            if (!this.sharedConnection) {
              return (ref = this.connection) != null ? ref.disconnect(flush) : void 0;
            }
          }
        }
        Group2.prototype.defaults = {
          timeout: 1e3 * 60 * 5,
          connection: null,
          Promise,
          id: "group-key"
        };
        return Group2;
      }).call(commonjsGlobal);
      var Group_1 = Group;
      var Batcher, Events$3, parser$4;
      parser$4 = parser;
      Events$3 = Events_1;
      Batcher = (function() {
        class Batcher2 {
          constructor(options = {}) {
            this.options = options;
            parser$4.load(this.options, this.defaults, this);
            this.Events = new Events$3(this);
            this._arr = [];
            this._resetPromise();
            this._lastFlush = Date.now();
          }
          _resetPromise() {
            return this._promise = new this.Promise((res, rej) => {
              return this._resolve = res;
            });
          }
          _flush() {
            clearTimeout(this._timeout);
            this._lastFlush = Date.now();
            this._resolve();
            this.Events.trigger("batch", this._arr);
            this._arr = [];
            return this._resetPromise();
          }
          add(data) {
            var ret;
            this._arr.push(data);
            ret = this._promise;
            if (this._arr.length === this.maxSize) {
              this._flush();
            } else if (this.maxTime != null && this._arr.length === 1) {
              this._timeout = setTimeout(() => {
                return this._flush();
              }, this.maxTime);
            }
            return ret;
          }
        }
        Batcher2.prototype.defaults = {
          maxTime: null,
          maxSize: null,
          Promise
        };
        return Batcher2;
      }).call(commonjsGlobal);
      var Batcher_1 = Batcher;
      var require$$4$1 = () => console.log("You must import the full version of Bottleneck in order to use this feature.");
      var require$$8 = getCjsExportFromNamespace(version$2);
      var Bottleneck2, DEFAULT_PRIORITY$1, Events$4, Job$1, LocalDatastore$1, NUM_PRIORITIES$1, Queues$1, RedisDatastore$1, States$1, Sync$1, parser$5, splice = [].splice;
      NUM_PRIORITIES$1 = 10;
      DEFAULT_PRIORITY$1 = 5;
      parser$5 = parser;
      Queues$1 = Queues_1;
      Job$1 = Job_1;
      LocalDatastore$1 = LocalDatastore_1;
      RedisDatastore$1 = require$$4$1;
      Events$4 = Events_1;
      States$1 = States_1;
      Sync$1 = Sync_1;
      Bottleneck2 = (function() {
        class Bottleneck3 {
          constructor(options = {}, ...invalid) {
            var storeInstanceOptions, storeOptions;
            this._addToQueue = this._addToQueue.bind(this);
            this._validateOptions(options, invalid);
            parser$5.load(options, this.instanceDefaults, this);
            this._queues = new Queues$1(NUM_PRIORITIES$1);
            this._scheduled = {};
            this._states = new States$1(["RECEIVED", "QUEUED", "RUNNING", "EXECUTING"].concat(this.trackDoneStatus ? ["DONE"] : []));
            this._limiter = null;
            this.Events = new Events$4(this);
            this._submitLock = new Sync$1("submit", this.Promise);
            this._registerLock = new Sync$1("register", this.Promise);
            storeOptions = parser$5.load(options, this.storeDefaults, {});
            this._store = (function() {
              if (this.datastore === "redis" || this.datastore === "ioredis" || this.connection != null) {
                storeInstanceOptions = parser$5.load(options, this.redisStoreDefaults, {});
                return new RedisDatastore$1(this, storeOptions, storeInstanceOptions);
              } else if (this.datastore === "local") {
                storeInstanceOptions = parser$5.load(options, this.localStoreDefaults, {});
                return new LocalDatastore$1(this, storeOptions, storeInstanceOptions);
              } else {
                throw new Bottleneck3.prototype.BottleneckError(`Invalid datastore type: ${this.datastore}`);
              }
            }).call(this);
            this._queues.on("leftzero", () => {
              var ref;
              return (ref = this._store.heartbeat) != null ? typeof ref.ref === "function" ? ref.ref() : void 0 : void 0;
            });
            this._queues.on("zero", () => {
              var ref;
              return (ref = this._store.heartbeat) != null ? typeof ref.unref === "function" ? ref.unref() : void 0 : void 0;
            });
          }
          _validateOptions(options, invalid) {
            if (!(options != null && typeof options === "object" && invalid.length === 0)) {
              throw new Bottleneck3.prototype.BottleneckError("Bottleneck v2 takes a single object argument. Refer to https://github.com/SGrondin/bottleneck#upgrading-to-v2 if you're upgrading from Bottleneck v1.");
            }
          }
          ready() {
            return this._store.ready;
          }
          clients() {
            return this._store.clients;
          }
          channel() {
            return `b_${this.id}`;
          }
          channel_client() {
            return `b_${this.id}_${this._store.clientId}`;
          }
          publish(message) {
            return this._store.__publish__(message);
          }
          disconnect(flush = true) {
            return this._store.__disconnect__(flush);
          }
          chain(_limiter) {
            this._limiter = _limiter;
            return this;
          }
          queued(priority) {
            return this._queues.queued(priority);
          }
          clusterQueued() {
            return this._store.__queued__();
          }
          empty() {
            return this.queued() === 0 && this._submitLock.isEmpty();
          }
          running() {
            return this._store.__running__();
          }
          done() {
            return this._store.__done__();
          }
          jobStatus(id) {
            return this._states.jobStatus(id);
          }
          jobs(status) {
            return this._states.statusJobs(status);
          }
          counts() {
            return this._states.statusCounts();
          }
          _randomIndex() {
            return Math.random().toString(36).slice(2);
          }
          check(weight = 1) {
            return this._store.__check__(weight);
          }
          _clearGlobalState(index) {
            if (this._scheduled[index] != null) {
              clearTimeout(this._scheduled[index].expiration);
              delete this._scheduled[index];
              return true;
            } else {
              return false;
            }
          }
          async _free(index, job, options, eventInfo) {
            var e, running;
            try {
              ({ running } = await this._store.__free__(index, options.weight));
              this.Events.trigger("debug", `Freed ${options.id}`, eventInfo);
              if (running === 0 && this.empty()) {
                return this.Events.trigger("idle");
              }
            } catch (error1) {
              e = error1;
              return this.Events.trigger("error", e);
            }
          }
          _run(index, job, wait2) {
            var clearGlobalState, free, run;
            job.doRun();
            clearGlobalState = this._clearGlobalState.bind(this, index);
            run = this._run.bind(this, index, job);
            free = this._free.bind(this, index, job);
            return this._scheduled[index] = {
              timeout: setTimeout(() => {
                return job.doExecute(this._limiter, clearGlobalState, run, free);
              }, wait2),
              expiration: job.options.expiration != null ? setTimeout(function() {
                return job.doExpire(clearGlobalState, run, free);
              }, wait2 + job.options.expiration) : void 0,
              job
            };
          }
          _drainOne(capacity) {
            return this._registerLock.schedule(() => {
              var args, index, next, options, queue;
              if (this.queued() === 0) {
                return this.Promise.resolve(null);
              }
              queue = this._queues.getFirst();
              ({ options, args } = next = queue.first());
              if (capacity != null && options.weight > capacity) {
                return this.Promise.resolve(null);
              }
              this.Events.trigger("debug", `Draining ${options.id}`, { args, options });
              index = this._randomIndex();
              return this._store.__register__(index, options.weight, options.expiration).then(({ success, wait: wait2, reservoir }) => {
                var empty;
                this.Events.trigger("debug", `Drained ${options.id}`, { success, args, options });
                if (success) {
                  queue.shift();
                  empty = this.empty();
                  if (empty) {
                    this.Events.trigger("empty");
                  }
                  if (reservoir === 0) {
                    this.Events.trigger("depleted", empty);
                  }
                  this._run(index, next, wait2);
                  return this.Promise.resolve(options.weight);
                } else {
                  return this.Promise.resolve(null);
                }
              });
            });
          }
          _drainAll(capacity, total = 0) {
            return this._drainOne(capacity).then((drained) => {
              var newCapacity;
              if (drained != null) {
                newCapacity = capacity != null ? capacity - drained : capacity;
                return this._drainAll(newCapacity, total + drained);
              } else {
                return this.Promise.resolve(total);
              }
            }).catch((e) => {
              return this.Events.trigger("error", e);
            });
          }
          _dropAllQueued(message) {
            return this._queues.shiftAll(function(job) {
              return job.doDrop({ message });
            });
          }
          stop(options = {}) {
            var done, waitForExecuting;
            options = parser$5.load(options, this.stopDefaults);
            waitForExecuting = (at) => {
              var finished;
              finished = () => {
                var counts;
                counts = this._states.counts;
                return counts[0] + counts[1] + counts[2] + counts[3] === at;
              };
              return new this.Promise((resolve, reject) => {
                if (finished()) {
                  return resolve();
                } else {
                  return this.on("done", () => {
                    if (finished()) {
                      this.removeAllListeners("done");
                      return resolve();
                    }
                  });
                }
              });
            };
            done = options.dropWaitingJobs ? (this._run = function(index, next) {
              return next.doDrop({
                message: options.dropErrorMessage
              });
            }, this._drainOne = () => {
              return this.Promise.resolve(null);
            }, this._registerLock.schedule(() => {
              return this._submitLock.schedule(() => {
                var k, ref, v;
                ref = this._scheduled;
                for (k in ref) {
                  v = ref[k];
                  if (this.jobStatus(v.job.options.id) === "RUNNING") {
                    clearTimeout(v.timeout);
                    clearTimeout(v.expiration);
                    v.job.doDrop({
                      message: options.dropErrorMessage
                    });
                  }
                }
                this._dropAllQueued(options.dropErrorMessage);
                return waitForExecuting(0);
              });
            })) : this.schedule({
              priority: NUM_PRIORITIES$1 - 1,
              weight: 0
            }, () => {
              return waitForExecuting(1);
            });
            this._receive = function(job) {
              return job._reject(new Bottleneck3.prototype.BottleneckError(options.enqueueErrorMessage));
            };
            this.stop = () => {
              return this.Promise.reject(new Bottleneck3.prototype.BottleneckError("stop() has already been called"));
            };
            return done;
          }
          async _addToQueue(job) {
            var args, blocked, error, options, reachedHWM, shifted, strategy;
            ({ args, options } = job);
            try {
              ({ reachedHWM, blocked, strategy } = await this._store.__submit__(this.queued(), options.weight));
            } catch (error1) {
              error = error1;
              this.Events.trigger("debug", `Could not queue ${options.id}`, { args, options, error });
              job.doDrop({ error });
              return false;
            }
            if (blocked) {
              job.doDrop();
              return true;
            } else if (reachedHWM) {
              shifted = strategy === Bottleneck3.prototype.strategy.LEAK ? this._queues.shiftLastFrom(options.priority) : strategy === Bottleneck3.prototype.strategy.OVERFLOW_PRIORITY ? this._queues.shiftLastFrom(options.priority + 1) : strategy === Bottleneck3.prototype.strategy.OVERFLOW ? job : void 0;
              if (shifted != null) {
                shifted.doDrop();
              }
              if (shifted == null || strategy === Bottleneck3.prototype.strategy.OVERFLOW) {
                if (shifted == null) {
                  job.doDrop();
                }
                return reachedHWM;
              }
            }
            job.doQueue(reachedHWM, blocked);
            this._queues.push(job);
            await this._drainAll();
            return reachedHWM;
          }
          _receive(job) {
            if (this._states.jobStatus(job.options.id) != null) {
              job._reject(new Bottleneck3.prototype.BottleneckError(`A job with the same id already exists (id=${job.options.id})`));
              return false;
            } else {
              job.doReceive();
              return this._submitLock.schedule(this._addToQueue, job);
            }
          }
          submit(...args) {
            var cb, fn, job, options, ref, ref1, task;
            if (typeof args[0] === "function") {
              ref = args, [fn, ...args] = ref, [cb] = splice.call(args, -1);
              options = parser$5.load({}, this.jobDefaults);
            } else {
              ref1 = args, [options, fn, ...args] = ref1, [cb] = splice.call(args, -1);
              options = parser$5.load(options, this.jobDefaults);
            }
            task = (...args2) => {
              return new this.Promise(function(resolve, reject) {
                return fn(...args2, function(...args3) {
                  return (args3[0] != null ? reject : resolve)(args3);
                });
              });
            };
            job = new Job$1(task, args, options, this.jobDefaults, this.rejectOnDrop, this.Events, this._states, this.Promise);
            job.promise.then(function(args2) {
              return typeof cb === "function" ? cb(...args2) : void 0;
            }).catch(function(args2) {
              if (Array.isArray(args2)) {
                return typeof cb === "function" ? cb(...args2) : void 0;
              } else {
                return typeof cb === "function" ? cb(args2) : void 0;
              }
            });
            return this._receive(job);
          }
          schedule(...args) {
            var job, options, task;
            if (typeof args[0] === "function") {
              [task, ...args] = args;
              options = {};
            } else {
              [options, task, ...args] = args;
            }
            job = new Job$1(task, args, options, this.jobDefaults, this.rejectOnDrop, this.Events, this._states, this.Promise);
            this._receive(job);
            return job.promise;
          }
          wrap(fn) {
            var schedule, wrapped;
            schedule = this.schedule.bind(this);
            wrapped = function(...args) {
              return schedule(fn.bind(this), ...args);
            };
            wrapped.withOptions = function(options, ...args) {
              return schedule(options, fn, ...args);
            };
            return wrapped;
          }
          async updateSettings(options = {}) {
            await this._store.__updateSettings__(parser$5.overwrite(options, this.storeDefaults));
            parser$5.overwrite(options, this.instanceDefaults, this);
            return this;
          }
          currentReservoir() {
            return this._store.__currentReservoir__();
          }
          incrementReservoir(incr = 0) {
            return this._store.__incrementReservoir__(incr);
          }
        }
        Bottleneck3.default = Bottleneck3;
        Bottleneck3.Events = Events$4;
        Bottleneck3.version = Bottleneck3.prototype.version = require$$8.version;
        Bottleneck3.strategy = Bottleneck3.prototype.strategy = {
          LEAK: 1,
          OVERFLOW: 2,
          OVERFLOW_PRIORITY: 4,
          BLOCK: 3
        };
        Bottleneck3.BottleneckError = Bottleneck3.prototype.BottleneckError = BottleneckError_1;
        Bottleneck3.Group = Bottleneck3.prototype.Group = Group_1;
        Bottleneck3.RedisConnection = Bottleneck3.prototype.RedisConnection = require$$2;
        Bottleneck3.IORedisConnection = Bottleneck3.prototype.IORedisConnection = require$$3;
        Bottleneck3.Batcher = Bottleneck3.prototype.Batcher = Batcher_1;
        Bottleneck3.prototype.jobDefaults = {
          priority: DEFAULT_PRIORITY$1,
          weight: 1,
          expiration: null,
          id: "<no-id>"
        };
        Bottleneck3.prototype.storeDefaults = {
          maxConcurrent: null,
          minTime: 0,
          highWater: null,
          strategy: Bottleneck3.prototype.strategy.LEAK,
          penalty: null,
          reservoir: null,
          reservoirRefreshInterval: null,
          reservoirRefreshAmount: null,
          reservoirIncreaseInterval: null,
          reservoirIncreaseAmount: null,
          reservoirIncreaseMaximum: null
        };
        Bottleneck3.prototype.localStoreDefaults = {
          Promise,
          timeout: null,
          heartbeatInterval: 250
        };
        Bottleneck3.prototype.redisStoreDefaults = {
          Promise,
          timeout: null,
          heartbeatInterval: 5e3,
          clientTimeout: 1e4,
          Redis: null,
          clientOptions: {},
          clusterNodes: null,
          clearDatastore: false,
          connection: null
        };
        Bottleneck3.prototype.instanceDefaults = {
          datastore: "local",
          connection: null,
          id: "<no-id>",
          rejectOnDrop: true,
          trackDoneStatus: false,
          Promise
        };
        Bottleneck3.prototype.stopDefaults = {
          enqueueErrorMessage: "This limiter has been stopped and cannot accept new jobs.",
          dropWaitingJobs: true,
          dropErrorMessage: "This limiter has been stopped."
        };
        return Bottleneck3;
      }).call(commonjsGlobal);
      var Bottleneck_1 = Bottleneck2;
      var lib = Bottleneck_1;
      return lib;
    }));
  }
});

// node_modules/.pnpm/@tmcp+transport-stdio@0.5.0_tmcp@1.20.0/node_modules/@tmcp/transport-stdio/src/index.js
import process2 from "node:process";

// node_modules/.pnpm/@tmcp+session-manager@0.3.0_tmcp@1.20.0/node_modules/@tmcp/session-manager/src/index.js
function matchesSubscription(filters, notification) {
  if (notification.method === "notifications/tools/list_changed") {
    return filters.toolsListChanged === true;
  }
  if (notification.method === "notifications/prompts/list_changed") {
    return filters.promptsListChanged === true;
  }
  if (notification.method === "notifications/resources/list_changed") {
    return filters.resourcesListChanged === true;
  }
  if (notification.method === "notifications/resources/updated") {
    const uri = (
      /** @type {Record<string, unknown> | undefined} */
      notification.params?.uri
    );
    return typeof uri === "string" && filters.resourceSubscriptions?.includes(uri) === true;
  }
  return false;
}
var SubscriptionManager = class {
  /**
   * @abstract
   * Atomically register a subscription. Matching notifications must be
   * buffered until acknowledgement completes and then delivered in order.
   * @param {Subscription} subscription
   * @param {SubscriptionCallbacks} callbacks
   * @returns {boolean | Promise<boolean>}
   */
  create(subscription, callbacks) {
    void subscription;
    void callbacks;
    throw new Error("Method not implemented.");
  }
  /**
   * @abstract
   * @param {JSONRPCRequest} notification
   * @returns {void | Promise<void>}
   */
  send(notification) {
    void notification;
    throw new Error("Method not implemented.");
  }
  /**
   * @abstract
   * Request closure of one subscription. Implementations must preserve the
   * JSON-RPC ID type when identifying a registration.
   * @param {string | number} id
   * @param {string} origin
   * @param {'closed' | 'cancelled'} reason
   * @returns {boolean | Promise<boolean>}
   */
  close(id, origin, reason) {
    void id;
    void origin;
    void reason;
    throw new Error("Method not implemented.");
  }
  /**
   * @abstract
   * Close every subscription, optionally limited to one transport origin.
   * @param {string} [origin]
   * @param {'closed' | 'cancelled'} [reason]
   * @returns {void | Promise<void>}
   */
  closeAll(origin, reason = "cancelled") {
    void origin;
    void reason;
    throw new Error("Method not implemented.");
  }
};
var InMemorySubscriptionManager = class extends SubscriptionManager {
  /** @type {Map<string, Map<string | number, { subscription: Subscription, callbacks: SubscriptionCallbacks, queue: Promise<'active' | 'failed'>, close_promise?: Promise<boolean> }>>} */
  #subscriptions = /* @__PURE__ */ new Map();
  /**
   * @param {{ subscription: Subscription, callbacks: SubscriptionCallbacks, queue: Promise<'active' | 'failed'>, close_promise?: Promise<boolean> }} record
   * @param {JSONRPCRequest} notification
   */
  #enqueue(record2, notification) {
    const delivery = record2.queue.then(async (state) => {
      if (state === "failed" || record2.close_promise) return state;
      await record2.callbacks.send(notification);
      return (
        /** @type {const} */
        "active"
      );
    });
    record2.queue = delivery.catch(() => "active");
    return delivery.then(() => {
    });
  }
  /**
   * @param {Subscription} subscription
   * @param {SubscriptionCallbacks} callbacks
   * @returns {Promise<boolean>}
   */
  async create(subscription, callbacks) {
    let subscriptions = this.#subscriptions.get(subscription.origin);
    if (!subscriptions) {
      subscriptions = /* @__PURE__ */ new Map();
      this.#subscriptions.set(subscription.origin, subscriptions);
    }
    if (subscriptions.has(subscription.id)) return false;
    let resolve_acknowledgement = () => {
    };
    let reject_acknowledgement = () => {
    };
    const acknowledge_promise = new Promise((resolve, reject) => {
      resolve_acknowledgement = resolve;
      reject_acknowledgement = reject;
    });
    const record2 = {
      subscription,
      callbacks,
      // Starting behind acknowledgement replaces both active and pending state.
      queue: acknowledge_promise.then(
        () => (
          /** @type {const} */
          "active"
        ),
        () => (
          /** @type {const} */
          "failed"
        )
      )
    };
    subscriptions.set(subscription.id, record2);
    try {
      Promise.resolve(callbacks.acknowledge()).then(
        resolve_acknowledgement,
        reject_acknowledgement
      );
    } catch (error) {
      reject_acknowledgement(error);
    }
    try {
      await acknowledge_promise;
      if (record2.close_promise) return true;
      await record2.queue;
      return true;
    } catch (error) {
      if (!record2.close_promise) {
        subscriptions.delete(subscription.id);
        if (subscriptions.size === 0) {
          this.#subscriptions.delete(subscription.origin);
        }
      }
      throw error;
    }
  }
  /**
   * @param {JSONRPCRequest} notification
   * @returns {Promise<void>}
   */
  async send(notification) {
    const deliveries = [];
    for (const subscriptions of this.#subscriptions.values()) {
      for (const record2 of subscriptions.values()) {
        if (record2.close_promise || !matchesSubscription(
          record2.subscription.filters,
          notification
        )) {
          continue;
        }
        deliveries.push(this.#enqueue(record2, notification));
      }
    }
    await Promise.all(deliveries);
  }
  /**
   * @param {string | number} id
   * @param {string} origin
   * @param {'closed' | 'cancelled'} reason
   * @returns {Promise<boolean>}
   */
  async close(id, origin, reason) {
    const subscriptions = this.#subscriptions.get(origin);
    if (!subscriptions) return false;
    const record2 = subscriptions.get(id);
    if (!record2) return false;
    if (record2.close_promise) return record2.close_promise;
    record2.close_promise = (async () => {
      try {
        await record2.queue;
        await record2.callbacks.close(reason);
        return true;
      } finally {
        if (subscriptions.get(id) === record2) subscriptions.delete(id);
        if (subscriptions.size === 0)
          this.#subscriptions.delete(origin);
      }
    })();
    return record2.close_promise;
  }
  /**
   * @param {string} [origin]
   * @param {'closed' | 'cancelled'} [reason]
   * @returns {Promise<void>}
   */
  async closeAll(origin, reason = "cancelled") {
    const registrations = [];
    for (const [stored_origin, subscriptions] of this.#subscriptions) {
      if (origin !== void 0 && stored_origin !== origin) continue;
      for (const id of subscriptions.keys()) {
        registrations.push([id, stored_origin]);
      }
    }
    await Promise.all(
      registrations.map(
        ([id, stored_origin]) => this.close(id, stored_origin, reason)
      )
    );
  }
};

// node_modules/.pnpm/@tmcp+transport-stdio@0.5.0_tmcp@1.20.0/node_modules/@tmcp/transport-stdio/src/index.js
var PROCESSING_DRAIN_TIMEOUT_MS = 1e3;
var StdioTransport = class {
  /**
   * @type {McpServer<any, TCustom>}
   */
  #server;
  /**
   * @type {Set<() => void>}
   */
  #cleaners = /* @__PURE__ */ new Set();
  /**
   * @type {NonNullable<Partial<Context["sessionInfo"]>>}
   */
  #session_info = {};
  /**
   * @type {Subscriptions}
   */
  #subscriptions = {
    resource: []
  };
  #subscription_manager = new InMemorySubscriptionManager();
  #subscription_origin = crypto.randomUUID();
  #initialized = false;
  /** @type {Map<string | number, { cancelled: boolean }>} */
  #listen_tasks = /* @__PURE__ */ new Map();
  #write_queue = Promise.resolve();
  #legacy_queue = Promise.resolve();
  /** @type {Set<Promise<void>>} */
  #processing_tasks = /* @__PURE__ */ new Set();
  /** @type {Promise<void> | undefined} */
  #closing;
  #listening = false;
  #writes_enabled = true;
  /**
   *
   * @param {McpServer<any, TCustom>} server
   */
  constructor(server2) {
    this.#server = server2;
    this.#cleaners.add(
      this.#server.on("send", ({ request: request2, subscriptionOrigin }) => {
        if (subscriptionOrigin !== void 0 && subscriptionOrigin !== this.#subscription_origin) {
          return;
        }
        void this.#write(request2).catch(() => {
        });
      })
    );
    this.#cleaners.add(
      this.#server.on("broadcast", ({ request: request2, subscriptionOnly }) => {
        void Promise.resolve(
          this.#subscription_manager.send(request2)
        ).catch(() => {
        });
        if (!this.#initialized || subscriptionOnly) return;
        if (request2.method === "notifications/resources/updated" && !this.#subscriptions.resource.includes(request2.params.uri)) {
          return;
        }
        this.#write(request2);
      })
    );
    this.#cleaners.add(
      this.#server.on("loglevelchange", ({ level }) => {
        this.#session_info.logLevel = level;
      })
    );
    this.#cleaners.add(
      this.#server.on("subscription", ({ uri, action }) => {
        this.#subscriptions ??= {
          resource: []
        };
        if (action === "remove") {
          this.#subscriptions.resource = this.#subscriptions.resource?.filter(
            (item) => item !== uri
          );
        } else {
          this.#subscriptions.resource?.push(uri);
        }
      })
    );
    this.#cleaners.add(
      this.#server.on("initialize", ({ capabilities, clientInfo }) => {
        this.#initialized = true;
        this.#session_info.clientCapabilities = capabilities;
        this.#session_info.clientInfo = clientInfo;
      })
    );
  }
  /** @param {unknown} message */
  #write(message) {
    if (!this.#writes_enabled) return Promise.resolve();
    const write = this.#write_queue.then(() => {
      if (!this.#writes_enabled) return;
      process2.stdout.write(JSON.stringify(message) + "\n");
    });
    this.#write_queue = write.catch(() => {
    });
    return write;
  }
  /**
   * @param {Record<string, any>} message
   * @param {TCustom} [ctx]
   */
  async #handle_message(message, ctx) {
    const is_init = message.method === "initialize";
    const session_info = is_init ? {
      clientCapabilities: message.params?.capabilities,
      clientInfo: message.params?.clientInfo
    } : this.#session_info;
    const is_listen = message.method === "subscriptions/listen" && (typeof message.id === "string" || typeof message.id === "number");
    const task = is_listen && !this.#listen_tasks.has(message.id) ? { cancelled: false } : void 0;
    if (task) this.#listen_tasks.set(message.id, task);
    if (message.method === "notifications/cancelled") {
      const request_id = message.params?.requestId;
      if ((typeof request_id === "string" || typeof request_id === "number") && (message.params?.reason === void 0 || typeof message.params.reason === "string")) {
        const cancelled = this.#listen_tasks.get(request_id);
        if (cancelled) cancelled.cancelled = true;
      }
    }
    try {
      const response = await this.#server.receive(
        /** @type {*} */
        message,
        {
          custom: ctx,
          sessionInfo: (
            /** @type {Context["sessionInfo"]} */
            session_info
          ),
          subscriptionOrigin: this.#subscription_origin,
          subscriptionManager: this.#subscription_manager
        }
      );
      if (response && !task?.cancelled) await this.#write(response);
    } finally {
      if (task && this.#listen_tasks.get(message.id) === task) {
        this.#listen_tasks.delete(message.id);
      }
    }
  }
  #shutdown() {
    if (this.#closing) return this.#closing;
    this.#closing = (async () => {
      for (const task of this.#listen_tasks.values()) {
        task.cancelled = true;
      }
      await this.#subscription_manager.closeAll(this.#subscription_origin, "cancelled").catch(() => {
      });
      let timeout;
      const drained = await Promise.race([
        Promise.allSettled([
          this.#legacy_queue,
          ...this.#processing_tasks
        ]).then(() => true),
        new Promise((resolve) => {
          timeout = setTimeout(
            () => resolve(false),
            PROCESSING_DRAIN_TIMEOUT_MS
          );
        })
      ]);
      clearTimeout(timeout);
      if (!drained) this.#writes_enabled = false;
      await this.#write_queue;
      for (const cleaner of this.#cleaners) {
        try {
          cleaner();
        } catch {
        }
      }
      this.#cleaners.clear();
    })().catch(() => {
    });
    return this.#closing;
  }
  /**
   * @param {TCustom} [ctx]
   */
  listen(ctx) {
    if (this.#listening || this.#closing) return;
    this.#listening = true;
    process2.stdin.setEncoding("utf8");
    let buffer = "";
    const on_data = (chunk) => {
      if (this.#closing) return;
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.trim()) {
          try {
            const message = JSON.parse(line);
            const per_request = typeof message.params?._meta?.["io.modelcontextprotocol/protocolVersion"] === "string";
            const cancels_listen = message.method === "notifications/cancelled" && this.#listen_tasks.has(message.params?.requestId);
            const is_response = typeof message.method !== "string";
            const is_control_notification = message.method === "notifications/cancelled" || message.method === "notifications/progress";
            if (per_request || cancels_listen || is_response || is_control_notification) {
              const task = this.#handle_message(
                message,
                ctx
              ).catch(() => {
              });
              this.#processing_tasks.add(task);
              void task.finally(
                () => this.#processing_tasks.delete(task)
              );
            } else {
              this.#legacy_queue = this.#legacy_queue.then(() => this.#handle_message(message, ctx)).catch(() => {
              });
            }
          } catch {
          }
        }
      }
    };
    const exit_after_shutdown = () => {
      void this.#shutdown().then(() => process2.exit(0));
    };
    const on_end = exit_after_shutdown;
    const on_sigint = exit_after_shutdown;
    const on_sigterm = exit_after_shutdown;
    process2.stdin.on("data", on_data);
    process2.stdin.on("end", on_end);
    process2.on("SIGINT", on_sigint);
    process2.on("SIGTERM", on_sigterm);
    this.#cleaners.add(() => process2.stdin.off("data", on_data));
    this.#cleaners.add(() => process2.stdin.off("end", on_end));
    this.#cleaners.add(() => process2.off("SIGINT", on_sigint));
    this.#cleaners.add(() => process2.off("SIGTERM", on_sigterm));
  }
  /**
   * @param {string | number} id
   * @returns {boolean | Promise<boolean>}
   */
  closeSubscription(id) {
    return this.#subscription_manager.close(
      id,
      this.#subscription_origin,
      "closed"
    );
  }
  close() {
    return this.#shutdown();
  }
};

// src/index.ts
import { readFileSync } from "node:fs";
import { dirname, join as join2 } from "node:path";
import { fileURLToPath } from "node:url";

// src/config/env.ts
var TAVILY_API_KEY = process.env.TAVILY_API_KEY;
var BRAVE_API_KEY = process.env.BRAVE_API_KEY;
var KAGI_API_KEY = process.env.KAGI_API_KEY;
var GITHUB_API_KEY = process.env.GITHUB_API_KEY;
var EXA_API_KEY = process.env.EXA_API_KEY;
var LINKUP_API_KEY = process.env.LINKUP_API_KEY;
var FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
var FIRECRAWL_BASE_URL = process.env.FIRECRAWL_BASE_URL;
var CONTEXT7_API_KEY = process.env.CONTEXT7_API_KEY;
var config = {
  search: {
    tavily: {
      api_key: TAVILY_API_KEY,
      base_url: "https://api.tavily.com",
      timeout: 3e4
      // 30 seconds
    },
    brave: {
      api_key: BRAVE_API_KEY,
      base_url: "https://api.search.brave.com/res/v1",
      timeout: 1e4
      // 10 seconds
    },
    kagi: {
      api_key: KAGI_API_KEY,
      base_url: "https://kagi.com/api/v0",
      timeout: 2e4
      // 20 seconds
    },
    github: {
      api_key: GITHUB_API_KEY,
      base_url: "https://api.github.com",
      timeout: 2e4
      // 20 seconds
    },
    exa: {
      api_key: EXA_API_KEY,
      base_url: "https://api.exa.ai",
      timeout: 3e4
      // 30 seconds
    },
    firecrawl: {
      api_key: FIRECRAWL_API_KEY,
      base_url: FIRECRAWL_BASE_URL ? `${FIRECRAWL_BASE_URL}/v2/search` : "https://api.firecrawl.dev/v2/search",
      timeout: 6e4
      // 60 seconds
    }
  },
  docs: {
    context7: {
      api_key: CONTEXT7_API_KEY,
      base_url: "https://context7.com/api/v2",
      timeout: 3e4
      // 30 seconds
    }
  },
  ai_response: {
    kagi_fastgpt: {
      api_key: KAGI_API_KEY,
      base_url: "https://kagi.com/api/v0/fastgpt",
      timeout: 3e4
      // 30 seconds
    },
    exa_answer: {
      api_key: EXA_API_KEY,
      base_url: "https://api.exa.ai",
      timeout: 3e4
      // 30 seconds
    },
    linkup: {
      api_key: LINKUP_API_KEY,
      base_url: "https://api.linkup.so/v1",
      timeout: 3e4
      // 30 seconds
    },
    tavily_research: {
      api_key: TAVILY_API_KEY,
      base_url: "https://api.tavily.com",
      request_timeout: 1e4
    }
  },
  processing: {
    kagi_summarizer: {
      api_key: KAGI_API_KEY,
      base_url: "https://kagi.com/api/v0/summarize",
      timeout: 3e4
      // 30 seconds
    },
    tavily_extract: {
      api_key: TAVILY_API_KEY,
      base_url: "https://api.tavily.com",
      timeout: 3e4
      // 30 seconds
    },
    tavily_crawl: {
      api_key: TAVILY_API_KEY,
      base_url: "https://api.tavily.com",
      timeout: 15e4
      // Tavily accepts crawl timeouts up to 150 seconds
    },
    tavily_map: {
      api_key: TAVILY_API_KEY,
      base_url: "https://api.tavily.com",
      timeout: 15e4
      // Tavily accepts map timeouts up to 150 seconds
    },
    firecrawl_scrape: {
      api_key: FIRECRAWL_API_KEY,
      base_url: FIRECRAWL_BASE_URL ? `${FIRECRAWL_BASE_URL}/v2/scrape` : "https://api.firecrawl.dev/v2/scrape",
      timeout: 6e4
      // 60 seconds - web scraping can take longer
    },
    firecrawl_crawl: {
      api_key: FIRECRAWL_API_KEY,
      base_url: FIRECRAWL_BASE_URL ? `${FIRECRAWL_BASE_URL}/v2/crawl` : "https://api.firecrawl.dev/v2/crawl",
      timeout: 12e4
      // 120 seconds - crawling can take even longer
    },
    firecrawl_map: {
      api_key: FIRECRAWL_API_KEY,
      base_url: FIRECRAWL_BASE_URL ? `${FIRECRAWL_BASE_URL}/v2/map` : "https://api.firecrawl.dev/v2/map",
      timeout: 6e4
      // 60 seconds
    },
    firecrawl_extract: {
      api_key: FIRECRAWL_API_KEY,
      base_url: FIRECRAWL_BASE_URL ? `${FIRECRAWL_BASE_URL}/v2/extract` : "https://api.firecrawl.dev/v2/extract",
      timeout: 6e4
      // 60 seconds
    },
    firecrawl_actions: {
      api_key: FIRECRAWL_API_KEY,
      base_url: FIRECRAWL_BASE_URL ? `${FIRECRAWL_BASE_URL}/v2/scrape` : "https://api.firecrawl.dev/v2/scrape",
      timeout: 9e4
      // 90 seconds - actions can take longer
    },
    exa_contents: {
      api_key: EXA_API_KEY,
      base_url: "https://api.exa.ai",
      timeout: 3e4
      // 30 seconds
    },
    exa_similar: {
      api_key: EXA_API_KEY,
      base_url: "https://api.exa.ai",
      timeout: 3e4
      // 30 seconds
    }
  },
  enhancement: {
    kagi_enrichment: {
      api_key: KAGI_API_KEY,
      base_url: "https://kagi.com/api/v0/enrich",
      timeout: 2e4
      // 20 seconds
    }
  }
};
var remote_deployment_markers = [
  "AWS_LAMBDA_FUNCTION_NAME",
  "CONTAINER",
  "DOCKER_CONTAINER",
  "FLY_APP_NAME",
  "K_SERVICE",
  "RENDER",
  "VERCEL"
];
var should_warn_for_local_file_offload = (env = process.env) => env.OMNISEARCH_LARGE_RESULT_MODE === "file" && remote_deployment_markers.some((marker) => Boolean(env[marker]));
var warn_for_local_file_offload = (env = process.env, warn = console.warn) => {
  if (!should_warn_for_local_file_offload(env)) return;
  warn(
    "Warning: OMNISEARCH_LARGE_RESULT_MODE=file returns server-side temp-file paths and is only useful for local shared-filesystem stdio clients. Use OMNISEARCH_LARGE_RESULT_MODE=inline for remote, hosted, or containerized MCP deployments."
  );
};
var validate_config = () => {
  const missing_keys = [];
  const available_keys = [];
  if (!TAVILY_API_KEY) missing_keys.push("TAVILY_API_KEY");
  else available_keys.push("TAVILY_API_KEY");
  if (!BRAVE_API_KEY) missing_keys.push("BRAVE_API_KEY");
  else available_keys.push("BRAVE_API_KEY");
  if (!KAGI_API_KEY) missing_keys.push("KAGI_API_KEY");
  else available_keys.push("KAGI_API_KEY");
  if (!GITHUB_API_KEY) missing_keys.push("GITHUB_API_KEY");
  else available_keys.push("GITHUB_API_KEY");
  if (!FIRECRAWL_API_KEY) missing_keys.push("FIRECRAWL_API_KEY");
  else available_keys.push("FIRECRAWL_API_KEY");
  if (!EXA_API_KEY) missing_keys.push("EXA_API_KEY");
  else available_keys.push("EXA_API_KEY");
  if (!LINKUP_API_KEY) missing_keys.push("LINKUP_API_KEY");
  else available_keys.push("LINKUP_API_KEY");
  if (!CONTEXT7_API_KEY) missing_keys.push("CONTEXT7_API_KEY");
  else available_keys.push("CONTEXT7_API_KEY");
  if (available_keys.length > 0) {
    console.error(`Found API keys for: ${available_keys.join(", ")}`);
  } else {
    console.error(
      "Warning: No API keys found. No providers will be available."
    );
  }
  if (missing_keys.length > 0) {
    console.warn(
      `Missing API keys for: ${missing_keys.join(
        ", "
      )}. Some providers will not be available.`
    );
  }
  warn_for_local_file_offload();
};

// node_modules/.pnpm/tmcp@1.20.0/node_modules/tmcp/src/adapter.js
var JsonSchemaAdapter = class {
  /**
   * @param {TSchema} schema
   * @returns {Promise<JSONSchema7>}
   */
  toJsonSchema(schema) {
    throw new Error("toJsonSchema method not implemented");
  }
};

// node_modules/.pnpm/@valibot+to-json-schema@1.7.0_valibot@1.5.0/node_modules/@valibot/to-json-schema/dist/index.mjs
function addError(errors, message) {
  if (errors) {
    errors.push(message);
    return errors;
  }
  return [message];
}
var ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;
function escapeRegExp(string2) {
  return string2.replace(ESCAPE_REGEX, "\\$&");
}
function handleError(message, config2) {
  switch (config2?.errorMode) {
    case "ignore":
      break;
    case "warn":
      console.warn(message);
      break;
    default:
      throw new Error(message);
  }
}
function isJsonConstValue(value) {
  return typeof value === "boolean" || typeof value === "number" && Number.isFinite(value) || typeof value === "string";
}
function isJsonEnumValues(values) {
  return values.every(isJsonConstValue);
}
function convertAction(jsonSchema, valibotAction, config2) {
  if (config2?.ignoreActions?.includes(valibotAction.type)) return jsonSchema;
  let errors;
  switch (valibotAction.type) {
    case "base64":
      jsonSchema.contentEncoding = "base64";
      break;
    case "bic":
    case "cuid2":
    case "decimal":
    case "digits":
    case "domain":
    case "emoji":
    case "hash":
    case "hexadecimal":
    case "hex_color":
    case "isrc":
    case "iso_time_second":
    case "iso_week":
    case "mac":
    case "mac48":
    case "mac64":
    case "nanoid":
    case "octal":
    case "slug":
    case "ulid":
      if (jsonSchema.pattern) errors = addError(errors, `The "${valibotAction.type}" action is not supported in combination with another regex action.`);
      else jsonSchema.pattern = valibotAction.requirement.source;
      break;
    case "description":
      jsonSchema.description = valibotAction.description;
      break;
    case "email":
    case "rfc_email":
      jsonSchema.format = "email";
      break;
    case "ends_with":
      if (jsonSchema.pattern) errors = addError(errors, `The "${valibotAction.type}" action is not supported in combination with another regex action.`);
      else jsonSchema.pattern = `${escapeRegExp(valibotAction.requirement)}$`;
      break;
    case "empty":
      if (jsonSchema.type === "array") jsonSchema.maxItems = 0;
      else {
        if (jsonSchema.type !== "string") errors = addError(errors, `The "${valibotAction.type}" action is not supported on type "${jsonSchema.type}".`);
        jsonSchema.maxLength = 0;
      }
      break;
    case "entries":
      jsonSchema.minProperties = valibotAction.requirement;
      jsonSchema.maxProperties = valibotAction.requirement;
      break;
    case "examples":
      if (Array.isArray(jsonSchema.examples)) jsonSchema.examples = [...jsonSchema.examples, ...valibotAction.examples];
      else jsonSchema.examples = valibotAction.examples;
      break;
    case "gt_value":
      if (jsonSchema.type !== "number" && jsonSchema.type !== "integer") errors = addError(errors, `The "gt_value" action is not supported on type "${jsonSchema.type}".`);
      if (config2?.target === "openapi-3.0") {
        errors = addError(errors, 'The "gt_value" action is not supported for OpenAPI 3.0.');
        break;
      }
      jsonSchema.exclusiveMinimum = valibotAction.requirement;
      break;
    case "includes":
      if (jsonSchema.pattern) errors = addError(errors, `The "${valibotAction.type}" action is not supported in combination with another regex action.`);
      else jsonSchema.pattern = escapeRegExp(valibotAction.requirement);
      break;
    case "integer":
      jsonSchema.type = "integer";
      break;
    case "ipv4":
      jsonSchema.format = "ipv4";
      break;
    case "ipv6":
      jsonSchema.format = "ipv6";
      break;
    case "iso_date":
      jsonSchema.format = "date";
      break;
    case "iso_date_time":
    case "iso_timestamp":
      jsonSchema.format = "date-time";
      break;
    case "iso_time":
      jsonSchema.format = "time";
      break;
    case "jws_compact":
      if (jsonSchema.pattern) errors = addError(errors, `The "${valibotAction.type}" action is not supported in combination with another regex action.`);
      else jsonSchema.pattern = valibotAction.requirement.source;
      break;
    case "length":
      if (jsonSchema.type === "array") {
        jsonSchema.minItems = valibotAction.requirement;
        jsonSchema.maxItems = valibotAction.requirement;
      } else {
        if (jsonSchema.type !== "string") errors = addError(errors, `The "${valibotAction.type}" action is not supported on type "${jsonSchema.type}".`);
        jsonSchema.minLength = valibotAction.requirement;
        jsonSchema.maxLength = valibotAction.requirement;
      }
      break;
    case "lt_value":
      if (jsonSchema.type !== "number" && jsonSchema.type !== "integer") errors = addError(errors, `The "lt_value" action is not supported on type "${jsonSchema.type}".`);
      if (config2?.target === "openapi-3.0") {
        errors = addError(errors, 'The "lt_value" action is not supported for OpenAPI 3.0.');
        break;
      }
      jsonSchema.exclusiveMaximum = valibotAction.requirement;
      break;
    case "max_entries":
      jsonSchema.maxProperties = valibotAction.requirement;
      break;
    case "max_length":
      if (jsonSchema.type === "array") jsonSchema.maxItems = valibotAction.requirement;
      else {
        if (jsonSchema.type !== "string") errors = addError(errors, `The "${valibotAction.type}" action is not supported on type "${jsonSchema.type}".`);
        jsonSchema.maxLength = valibotAction.requirement;
      }
      break;
    case "max_value":
      if (jsonSchema.type !== "number" && jsonSchema.type !== "integer") errors = addError(errors, `The "max_value" action is not supported on type "${jsonSchema.type}".`);
      jsonSchema.maximum = valibotAction.requirement;
      break;
    case "metadata":
      if (typeof valibotAction.metadata.title === "string") jsonSchema.title = valibotAction.metadata.title;
      if (typeof valibotAction.metadata.description === "string") jsonSchema.description = valibotAction.metadata.description;
      if (Array.isArray(valibotAction.metadata.examples)) if (Array.isArray(jsonSchema.examples)) jsonSchema.examples = [...jsonSchema.examples, ...valibotAction.metadata.examples];
      else jsonSchema.examples = valibotAction.metadata.examples;
      break;
    case "min_entries":
      jsonSchema.minProperties = valibotAction.requirement;
      break;
    case "min_length":
      if (jsonSchema.type === "array") jsonSchema.minItems = valibotAction.requirement;
      else {
        if (jsonSchema.type !== "string") errors = addError(errors, `The "${valibotAction.type}" action is not supported on type "${jsonSchema.type}".`);
        jsonSchema.minLength = valibotAction.requirement;
      }
      break;
    case "min_value":
      if (jsonSchema.type !== "number" && jsonSchema.type !== "integer") errors = addError(errors, `The "min_value" action is not supported on type "${jsonSchema.type}".`);
      jsonSchema.minimum = valibotAction.requirement;
      break;
    case "multiple_of":
      jsonSchema.multipleOf = valibotAction.requirement;
      break;
    case "non_empty":
      if (jsonSchema.type === "array") jsonSchema.minItems = 1;
      else {
        if (jsonSchema.type !== "string") errors = addError(errors, `The "${valibotAction.type}" action is not supported on type "${jsonSchema.type}".`);
        jsonSchema.minLength = 1;
      }
      break;
    case "not_value":
      if (!isJsonConstValue(valibotAction.requirement)) {
        errors = addError(errors, 'The requirement of the "not_value" action is not JSON compatible.');
        break;
      }
      if (config2?.target === "openapi-3.0") jsonSchema.not = { enum: [valibotAction.requirement] };
      else jsonSchema.not = { const: valibotAction.requirement };
      break;
    case "not_values":
      if (!isJsonEnumValues(valibotAction.requirement)) {
        errors = addError(errors, 'A requirement of the "not_values" action is not JSON compatible.');
        break;
      }
      jsonSchema.not = { enum: valibotAction.requirement };
      break;
    case "regex":
      if (valibotAction.requirement.flags) errors = addError(errors, "RegExp flags are not supported by JSON Schema.");
      if (jsonSchema.pattern) errors = addError(errors, `The "${valibotAction.type}" action is not supported in combination with another regex action.`);
      else jsonSchema.pattern = valibotAction.requirement.source;
      break;
    case "safe_integer":
      jsonSchema.type = "integer";
      if (typeof jsonSchema.minimum !== "number" || jsonSchema.minimum < Number.MIN_SAFE_INTEGER) jsonSchema.minimum = Number.MIN_SAFE_INTEGER;
      if (typeof jsonSchema.maximum !== "number" || jsonSchema.maximum > Number.MAX_SAFE_INTEGER) jsonSchema.maximum = Number.MAX_SAFE_INTEGER;
      break;
    case "starts_with":
      if (jsonSchema.pattern) errors = addError(errors, `The "${valibotAction.type}" action is not supported in combination with another regex action.`);
      else jsonSchema.pattern = `^${escapeRegExp(valibotAction.requirement)}`;
      break;
    case "title":
      jsonSchema.title = valibotAction.title;
      break;
    case "url":
      jsonSchema.format = "uri";
      break;
    case "uuid":
      jsonSchema.format = "uuid";
      break;
    case "value":
      if (!isJsonConstValue(valibotAction.requirement)) {
        errors = addError(errors, 'The requirement of the "value" action is not JSON compatible.');
        break;
      }
      if (config2?.target === "openapi-3.0") jsonSchema.enum = [valibotAction.requirement];
      else jsonSchema.const = valibotAction.requirement;
      break;
    case "values":
      if (!isJsonEnumValues(valibotAction.requirement)) {
        errors = addError(errors, 'A requirement of the "values" action is not JSON compatible.');
        break;
      }
      jsonSchema.enum = valibotAction.requirement;
      break;
    default:
      errors = addError(errors, `The "${valibotAction.type}" action cannot be converted to JSON Schema.`);
  }
  if (config2?.overrideAction) {
    const actionOverride = config2.overrideAction({
      valibotAction,
      jsonSchema,
      errors
    });
    if (actionOverride) return { ...actionOverride };
  }
  if (errors) for (const message of errors) handleError(message, config2);
  return jsonSchema;
}
function flattenPipe(pipe2) {
  return pipe2.flatMap((item) => "pipe" in item ? flattenPipe(item.pipe) : item);
}
var refCount = 0;
function convertSchema(jsonSchema, valibotSchema, config2, context, skipRef = false) {
  if (!skipRef) {
    const referenceId = context.referenceMap.get(valibotSchema);
    if (referenceId) {
      jsonSchema.$ref = `#/$defs/${referenceId}`;
      if (config2?.overrideRef) {
        const refOverride = config2.overrideRef({
          ...context,
          referenceId,
          valibotSchema,
          jsonSchema
        });
        if (refOverride) jsonSchema.$ref = refOverride;
      }
      return jsonSchema;
    }
  }
  if ("pipe" in valibotSchema) {
    const flatPipe = flattenPipe(valibotSchema.pipe);
    let startIndex = 0;
    let stopIndex = flatPipe.length - 1;
    if (config2?.typeMode === "input") {
      const inputStopIndex = flatPipe.slice(1).findIndex((item) => item.kind === "schema" || item.kind === "transformation" && (item.type === "find_item" || item.type === "parse_json" || item.type === "raw_transform" || item.type === "reduce_items" || item.type === "stringify_json" || item.type === "to_bigint" || item.type === "to_boolean" || item.type === "to_date" || item.type === "to_number" || item.type === "to_string" || item.type === "transform"));
      if (inputStopIndex !== -1) stopIndex = inputStopIndex;
    } else if (config2?.typeMode === "output") {
      const outputStartIndex = flatPipe.findLastIndex((item) => item.kind === "schema");
      if (outputStartIndex !== -1) startIndex = outputStartIndex;
    }
    for (let index = startIndex; index <= stopIndex; index++) {
      const valibotPipeItem = flatPipe[index];
      if (valibotPipeItem.kind === "schema") {
        if (index > startIndex) handleError('Set the "typeMode" config to "input" or "output" to convert pipelines with multiple schemas.', config2);
        jsonSchema = convertSchema(jsonSchema, valibotPipeItem, config2, context, true);
      } else jsonSchema = convertAction(jsonSchema, valibotPipeItem, config2);
    }
    return jsonSchema;
  }
  let errors;
  switch (valibotSchema.type) {
    case "boolean":
      jsonSchema.type = "boolean";
      break;
    case "null":
      if (config2?.target === "openapi-3.0") jsonSchema.enum = [null];
      else jsonSchema.type = "null";
      break;
    case "number":
      jsonSchema.type = "number";
      break;
    case "string":
      jsonSchema.type = "string";
      break;
    case "array":
      jsonSchema.type = "array";
      jsonSchema.items = convertSchema({}, valibotSchema.item, config2, context);
      break;
    case "tuple":
    case "tuple_with_rest":
    case "loose_tuple":
    case "strict_tuple":
      jsonSchema.type = "array";
      if (config2?.target === "openapi-3.0") {
        jsonSchema.items = { anyOf: [] };
        jsonSchema.minItems = valibotSchema.items.length;
        for (const item of valibotSchema.items) jsonSchema.items.anyOf.push(convertSchema({}, item, config2, context));
        if (valibotSchema.type === "tuple_with_rest") jsonSchema.items.anyOf.push(convertSchema({}, valibotSchema.rest, config2, context));
        else if (valibotSchema.type === "strict_tuple" || valibotSchema.type === "tuple") jsonSchema.maxItems = valibotSchema.items.length;
      } else if (config2?.target === "draft-2020-12") {
        jsonSchema.prefixItems = [];
        jsonSchema.minItems = valibotSchema.items.length;
        for (const item of valibotSchema.items) jsonSchema.prefixItems.push(convertSchema({}, item, config2, context));
        if (valibotSchema.type === "tuple_with_rest") jsonSchema.items = convertSchema({}, valibotSchema.rest, config2, context);
        else if (valibotSchema.type === "strict_tuple") jsonSchema.items = false;
      } else {
        jsonSchema.items = [];
        jsonSchema.minItems = valibotSchema.items.length;
        for (const item of valibotSchema.items) jsonSchema.items.push(convertSchema({}, item, config2, context));
        if (valibotSchema.type === "tuple_with_rest") jsonSchema.additionalItems = convertSchema({}, valibotSchema.rest, config2, context);
        else if (valibotSchema.type === "strict_tuple") jsonSchema.additionalItems = false;
      }
      break;
    case "object":
    case "object_with_rest":
    case "loose_object":
    case "strict_object":
      jsonSchema.type = "object";
      jsonSchema.properties = {};
      jsonSchema.required = [];
      for (const key in valibotSchema.entries) {
        const entry = valibotSchema.entries[key];
        jsonSchema.properties[key] = convertSchema({}, entry, config2, context);
        if (entry.type !== "exact_optional" && entry.type !== "nullish" && entry.type !== "optional") jsonSchema.required.push(key);
      }
      if (valibotSchema.type === "object_with_rest") jsonSchema.additionalProperties = convertSchema({}, valibotSchema.rest, config2, context);
      else if (valibotSchema.type === "strict_object") jsonSchema.additionalProperties = false;
      break;
    case "record":
      if (config2?.target === "openapi-3.0" && "pipe" in valibotSchema.key) errors = addError(errors, 'The "record" schema with a schema for the key that contains a "pipe" cannot be converted to JSON Schema.');
      if (valibotSchema.key.type !== "string") errors = addError(errors, `The "record" schema with the "${valibotSchema.key.type}" schema for the key cannot be converted to JSON Schema.`);
      jsonSchema.type = "object";
      if (config2?.target !== "openapi-3.0") jsonSchema.propertyNames = convertSchema({}, valibotSchema.key, config2, context);
      jsonSchema.additionalProperties = convertSchema({}, valibotSchema.value, config2, context);
      break;
    case "any":
    case "unknown":
      break;
    case "never":
      jsonSchema.not = {};
      break;
    case "nullable":
    case "nullish":
      if (config2?.target === "openapi-3.0") {
        const innerSchema = convertSchema({}, valibotSchema.wrapped, config2, context);
        Object.assign(jsonSchema, innerSchema);
        jsonSchema.nullable = true;
      } else jsonSchema.anyOf = [convertSchema({}, valibotSchema.wrapped, config2, context), { type: "null" }];
      if (valibotSchema.default !== void 0) jsonSchema.default = typeof valibotSchema.default === "function" ? valibotSchema.default() : valibotSchema.default;
      break;
    case "exact_optional":
    case "optional":
    case "undefinedable":
      jsonSchema = convertSchema(jsonSchema, valibotSchema.wrapped, config2, context);
      if (valibotSchema.default !== void 0) jsonSchema.default = typeof valibotSchema.default === "function" ? valibotSchema.default() : valibotSchema.default;
      break;
    case "literal":
      if (typeof valibotSchema.literal !== "boolean" && typeof valibotSchema.literal !== "number" && typeof valibotSchema.literal !== "string") errors = addError(errors, 'The value of the "literal" schema is not JSON compatible.');
      if (config2?.target === "openapi-3.0") jsonSchema.enum = [valibotSchema.literal];
      else jsonSchema.const = valibotSchema.literal;
      break;
    case "enum":
      jsonSchema.enum = valibotSchema.options;
      if (valibotSchema.options.every((option) => typeof option === "string")) jsonSchema.type = "string";
      else if (valibotSchema.options.every((option) => typeof option === "number")) jsonSchema.type = "number";
      else if (config2?.target !== "openapi-3.0") jsonSchema.type = ["string", "number"];
      break;
    case "picklist": {
      const hasInvalidOption = valibotSchema.options.some((option) => typeof option !== "number" && typeof option !== "string");
      if (hasInvalidOption) errors = addError(errors, 'An option of the "picklist" schema is not JSON compatible.');
      jsonSchema.enum = valibotSchema.options;
      if (valibotSchema.options.every((option) => typeof option === "string")) jsonSchema.type = "string";
      else if (valibotSchema.options.every((option) => typeof option === "number")) jsonSchema.type = "number";
      else if (!hasInvalidOption && config2?.target !== "openapi-3.0") jsonSchema.type = ["string", "number"];
      break;
    }
    case "union":
      jsonSchema.anyOf = valibotSchema.options.map((option) => convertSchema({}, option, config2, context));
      break;
    case "variant":
      jsonSchema.oneOf = valibotSchema.options.map((option) => convertSchema({}, option, config2, context));
      break;
    case "intersect":
      jsonSchema.allOf = valibotSchema.options.map((option) => convertSchema({}, option, config2, context));
      break;
    case "lazy": {
      let wrappedValibotSchema = context.getterMap.get(valibotSchema.getter);
      if (!wrappedValibotSchema) {
        wrappedValibotSchema = valibotSchema.getter(void 0);
        context.getterMap.set(valibotSchema.getter, wrappedValibotSchema);
      }
      let referenceId = context.referenceMap.get(wrappedValibotSchema);
      if (!referenceId) {
        referenceId = `${refCount++}`;
        context.referenceMap.set(wrappedValibotSchema, referenceId);
        context.definitions[referenceId] = convertSchema({}, wrappedValibotSchema, config2, context, true);
      }
      jsonSchema.$ref = `#/$defs/${referenceId}`;
      if (config2?.overrideRef) {
        const refOverride = config2.overrideRef({
          ...context,
          referenceId,
          valibotSchema: wrappedValibotSchema,
          jsonSchema
        });
        if (refOverride) jsonSchema.$ref = refOverride;
      }
      break;
    }
    default:
      errors = addError(errors, `The "${valibotSchema.type}" schema cannot be converted to JSON Schema.`);
  }
  if (config2?.overrideSchema) {
    const schemaOverride = config2.overrideSchema({
      ...context,
      referenceId: context.referenceMap.get(valibotSchema),
      valibotSchema,
      jsonSchema,
      errors
    });
    if (schemaOverride) return { ...schemaOverride };
  }
  if (errors) for (const message of errors) handleError(message, config2);
  return jsonSchema;
}
var store;
function getGlobalDefs() {
  return store;
}
function toJsonSchema(schema, config2) {
  const context = {
    definitions: {},
    referenceMap: /* @__PURE__ */ new Map(),
    getterMap: /* @__PURE__ */ new Map()
  };
  const definitions = config2?.definitions ?? getGlobalDefs();
  if (definitions) {
    for (const key in definitions) context.referenceMap.set(definitions[key], key);
    for (const key in definitions) context.definitions[key] = convertSchema({}, definitions[key], config2, context, true);
  }
  const jsonSchema = convertSchema({}, schema, config2, context);
  const target = config2?.target ?? "draft-07";
  if (target === "draft-2020-12") jsonSchema.$schema = "https://json-schema.org/draft/2020-12/schema";
  else if (target === "draft-07") jsonSchema.$schema = "http://json-schema.org/draft-07/schema#";
  if (context.referenceMap.size) jsonSchema.$defs = context.definitions;
  return jsonSchema;
}

// node_modules/.pnpm/@tmcp+adapter-valibot@0.1.6_tmcp@1.20.0_valibot@1.5.0/node_modules/@tmcp/adapter-valibot/src/index.js
function add_type_to_enums(json_schema) {
  for (let key in json_schema) {
    const property = json_schema[
      /** @type {keyof json_schema} */
      key
    ];
    if (property != null && typeof property === "object" && !Array.isArray(property)) {
      if ("enum" in property && !("type" in property)) {
        property.type = "string";
      }
      add_type_to_enums(property);
    }
  }
  return json_schema;
}
var ValibotJsonSchemaAdapter = class extends JsonSchemaAdapter {
  /**
   * Converts a Valibot schema to JSON Schema format
   * @param {GenericSchema} schema - The Valibot schema to convert
   * @returns {Promise<ReturnType<typeof toJsonSchema>>} - The converted JSON Schema
   */
  async toJsonSchema(schema) {
    return add_type_to_enums(toJsonSchema(schema));
  }
};

// node_modules/.pnpm/tmcp@1.20.0/node_modules/tmcp/src/index.js
var import_json_rpc_22 = __toESM(require_dist(), 1);
import { AsyncLocalStorage } from "node:async_hooks";

// node_modules/.pnpm/uri-template-matcher@1.1.2/node_modules/uri-template-matcher/src/parser.js
function parse_template(template) {
  const parts = [];
  let current_literal = "";
  let i = 0;
  while (i < template.length) {
    const char = template[i];
    if (char === "{") {
      if (current_literal) {
        parts.push({ type: "literal", value: current_literal });
        current_literal = "";
      }
      const expression_start = i + 1;
      let expression_end = expression_start;
      let brace_count = 1;
      while (expression_end < template.length && brace_count > 0) {
        if (template[expression_end] === "{") {
          brace_count++;
        } else if (template[expression_end] === "}") {
          brace_count--;
        }
        expression_end++;
      }
      if (brace_count > 0) {
        throw new Error(`Unclosed expression in template: ${template}`);
      }
      const expression_content = template.slice(
        expression_start,
        expression_end - 1
      );
      const parsed_expression = parse_expression(expression_content);
      parts.push(parsed_expression);
      i = expression_end;
    } else {
      current_literal += char;
      i++;
    }
  }
  if (current_literal) {
    parts.push({ type: "literal", value: current_literal });
  }
  return { template, parts };
}
function parse_expression(content) {
  if (!content.trim()) {
    throw new Error("Empty expression");
  }
  const first_char = content[0];
  const operators = ["+", "#", ".", "/", ";", "?", "&"];
  let operator = void 0;
  let variables_part = content;
  if (operators.includes(first_char)) {
    operator = first_char;
    variables_part = content.slice(1);
  }
  const variable_names = split_variables(variables_part);
  const expressions = variable_names.map(parse_variable);
  return {
    type: "expression",
    expressions,
    operator
  };
}
function split_variables(variables) {
  const result = [];
  let current = "";
  let i = 0;
  while (i < variables.length) {
    const char = variables[i];
    if (char === ",") {
      if (current.trim()) {
        result.push(current.trim());
        current = "";
      }
    } else {
      current += char;
    }
    i++;
  }
  if (current.trim()) {
    result.push(current.trim());
  }
  return result;
}
function parse_variable(variable) {
  let name2 = variable;
  let prefix = void 0;
  let explode = false;
  if (name2.endsWith("*")) {
    explode = true;
    name2 = name2.slice(0, -1);
  }
  const colon_index = name2.indexOf(":");
  if (colon_index !== -1) {
    const prefix_str = name2.slice(colon_index + 1);
    prefix = parseInt(prefix_str, 10);
    if (isNaN(prefix) || prefix < 0) {
      throw new Error(`Invalid prefix length: ${prefix_str}`);
    }
    name2 = name2.slice(0, colon_index);
  }
  if (!name2) {
    throw new Error("Empty variable name");
  }
  return { name: name2, prefix, explode };
}
function match_uri(uri, parsed_template) {
  const params = {};
  const result = match_parts(uri, 0, parsed_template.parts, 0, params);
  if (!result || result.uri_index !== uri.length) {
    return null;
  }
  return params;
}
function match_parts(uri, uri_index, parts, part_index, params) {
  if (part_index >= parts.length) {
    return { uri_index };
  }
  const part = parts[part_index];
  if (part.type === "literal") {
    if (!uri.slice(uri_index).startsWith(part.value)) {
      return null;
    }
    return match_parts(
      uri,
      uri_index + part.value.length,
      parts,
      part_index + 1,
      params
    );
  } else {
    const next_part = parts[part_index + 1];
    const boundaries = find_expression_boundaries(
      uri,
      uri_index,
      next_part
    );
    const sorted_boundaries = boundaries.sort((a, b) => {
      if (next_part && next_part.type === "expression" && !next_part.operator) {
        return b - a;
      }
      return a - b;
    });
    for (const boundary of sorted_boundaries) {
      const segment = uri.slice(uri_index, boundary);
      const temp_params = { ...params };
      const match_result = match_simple_expression(
        segment,
        part,
        temp_params,
        uri,
        uri_index
      );
      if (match_result) {
        const rest_result = match_parts(
          uri,
          boundary,
          parts,
          part_index + 1,
          temp_params
        );
        if (rest_result) {
          Object.assign(params, temp_params);
          return rest_result;
        }
      }
    }
    return null;
  }
}
function find_expression_boundaries(uri, start_index, next_part) {
  const boundaries = [];
  if (next_part && next_part.type === "literal") {
    let search_index = start_index;
    while (search_index < uri.length) {
      const found_index = uri.indexOf(next_part.value, search_index);
      if (found_index === -1) break;
      boundaries.push(found_index);
      search_index = found_index + 1;
    }
    if (boundaries.length === 0) {
      return [];
    }
  } else if (next_part && next_part.type === "expression") {
    const next_expr = (
      /** @type {ExpressionPart} */
      next_part
    );
    if (next_expr.operator === ".") {
      for (let i = start_index; i < uri.length; i++) {
        if (uri[i] === ".") {
          boundaries.push(i);
        }
      }
      boundaries.push(uri.length);
    } else if (next_expr.operator === "/") {
      for (let i = start_index; i < uri.length; i++) {
        if (uri[i] === "/") {
          boundaries.push(i);
        }
      }
    } else {
      for (let i = start_index; i <= uri.length; i++) {
        boundaries.push(i);
      }
    }
  } else {
    boundaries.push(uri.length);
  }
  return boundaries.sort((a, b) => a - b);
}
function match_simple_expression(segment, expression, params, uri, uri_index) {
  if (expression.type !== "expression") {
    return false;
  }
  const operator = expression.operator;
  switch (operator) {
    case "+":
      return handle_reserved_match(segment, expression, params);
    case "#":
      return handle_fragment_match(segment, expression, params);
    case ".":
      return handle_dot_match(segment, expression, params);
    case "/":
      return handle_path_match(segment, expression, params);
    case ";":
      return handle_semicolon_match(segment, expression, params);
    case "?":
    case "&":
      return handle_query_match(segment, expression, params);
    default:
      return handle_simple_match(
        segment,
        expression,
        params,
        uri,
        uri_index
      );
  }
}
function handle_fragment_match(segment, expression, params) {
  if (expression.type !== "expression") {
    return false;
  }
  if (!segment.startsWith("#")) {
    for (const expr of expression.expressions) {
      params[expr.name] = "";
    }
    return segment === "";
  }
  const fragment_content = segment.slice(1);
  if (expression.expressions.length === 1) {
    const expr = expression.expressions[0];
    let value = fragment_content;
    if (expr.prefix && value.length > expr.prefix) {
      value = value.slice(0, expr.prefix);
    }
    params[expr.name] = decodeURIComponent(value);
    return true;
  } else {
    const values = fragment_content.split(",");
    for (let i = 0; i < expression.expressions.length; i++) {
      const expr = expression.expressions[i];
      let value = values[i] || "";
      if (expr.prefix && value.length > expr.prefix) {
        value = value.slice(0, expr.prefix);
      }
      params[expr.name] = decodeURIComponent(value);
    }
    return true;
  }
}
function handle_reserved_match(segment, expression, params) {
  if (expression.type !== "expression") {
    return false;
  }
  if (expression.expressions.length === 1) {
    const expr = expression.expressions[0];
    let value = segment;
    if (expr.prefix && value.length > expr.prefix) {
      value = value.slice(0, expr.prefix);
    }
    params[expr.name] = decodeURIComponent(value);
    return true;
  } else {
    const values = segment.split(",");
    for (let i = 0; i < expression.expressions.length; i++) {
      const expr = expression.expressions[i];
      let value = values[i] || "";
      if (expr.prefix && value.length > expr.prefix) {
        value = value.slice(0, expr.prefix);
      }
      params[expr.name] = decodeURIComponent(value);
    }
    return true;
  }
}
function handle_simple_match(segment, expression, params, uri, uri_index) {
  if (expression.type !== "expression") {
    return false;
  }
  if (expression.expressions.length === 1) {
    const expr = expression.expressions[0];
    let value = segment;
    if (value.includes("/")) {
      return false;
    }
    if (value === "" && uri_index + segment.length === uri.length && uri.endsWith("/")) {
      return false;
    }
    if (expr.prefix && value.length > expr.prefix) {
      value = value.slice(0, expr.prefix);
    }
    params[expr.name] = decodeURIComponent(value);
    return true;
  } else {
    const values = segment.split(",");
    for (let i = 0; i < expression.expressions.length; i++) {
      const expr = expression.expressions[i];
      let value = values[i] || "";
      if (value.includes("/")) {
        return false;
      }
      if (expr.prefix && value.length > expr.prefix) {
        value = value.slice(0, expr.prefix);
      }
      params[expr.name] = decodeURIComponent(value);
    }
    return true;
  }
}
function handle_dot_match(segment, expression, params) {
  if (expression.type !== "expression") {
    return false;
  }
  if (segment === "") {
    for (const expr of expression.expressions) {
      params[expr.name] = "";
    }
    return true;
  }
  const clean_segment = segment.startsWith(".") ? segment.slice(1) : segment;
  if (expression.expressions.length === 1) {
    const expr = expression.expressions[0];
    if (expr.explode) {
      const values = clean_segment.split(".");
      params[expr.name] = values.map((v) => decodeURIComponent(v));
    } else {
      params[expr.name] = decodeURIComponent(clean_segment);
    }
    return true;
  } else {
    const values = clean_segment.split(".");
    for (let i = 0; i < expression.expressions.length; i++) {
      const expr = expression.expressions[i];
      let value = values[i] || "";
      if (expr.prefix && value.length > expr.prefix) {
        value = value.slice(0, expr.prefix);
      }
      params[expr.name] = decodeURIComponent(value);
    }
    return true;
  }
}
function handle_path_match(segment, expression, params) {
  if (expression.type !== "expression") {
    return false;
  }
  const clean_segment = segment.startsWith("/") ? segment.slice(1) : segment;
  if (expression.expressions.length === 1) {
    const expr = expression.expressions[0];
    params[expr.name] = decodeURIComponent(clean_segment);
    return true;
  } else {
    const values = clean_segment.split(",");
    for (let i = 0; i < expression.expressions.length; i++) {
      const expr = expression.expressions[i];
      let value = values[i] || "";
      if (expr.prefix && value.length > expr.prefix) {
        value = value.slice(0, expr.prefix);
      }
      params[expr.name] = decodeURIComponent(value);
    }
    return true;
  }
}
function handle_semicolon_match(segment, expression, params) {
  if (expression.type !== "expression") {
    return false;
  }
  const parts = segment.split(";").filter((p) => p);
  for (const part of parts) {
    const eq_index = part.indexOf("=");
    if (eq_index !== -1) {
      const key = part.slice(0, eq_index);
      const value = part.slice(eq_index + 1);
      const expr = expression.expressions.find((e) => e.name === key);
      if (expr) {
        params[expr.name] = decodeURIComponent(value);
      }
    }
  }
  return true;
}
function handle_query_match(segment, expression, params) {
  if (expression.type !== "expression") {
    return false;
  }
  const clean_segment = segment.replace(/^[?&]/, "");
  if (expression.expressions.length === 1) {
    const expr = expression.expressions[0];
    if (expr.explode) {
      const values = clean_segment.split("&");
      params[expr.name] = values.map((v) => decodeURIComponent(v));
    } else {
      const parts = clean_segment.split("&");
      for (const part of parts) {
        const eq_index = part.indexOf("=");
        if (eq_index !== -1) {
          const key = part.slice(0, eq_index);
          const value = part.slice(eq_index + 1);
          if (key === expr.name) {
            params[expr.name] = decodeURIComponent(value);
          }
        }
      }
    }
  } else {
    const parts = clean_segment.split("&");
    for (const part of parts) {
      const eq_index = part.indexOf("=");
      if (eq_index !== -1) {
        const key = part.slice(0, eq_index);
        const value = part.slice(eq_index + 1);
        const expr = expression.expressions.find((e) => e.name === key);
        if (expr) {
          params[expr.name] = decodeURIComponent(value);
        }
      }
    }
  }
  return true;
}

// node_modules/.pnpm/uri-template-matcher@1.1.2/node_modules/uri-template-matcher/src/matcher.js
var UriTemplateMatcher = class {
  /**
   * Create a new UriTemplateMatcher instance
   */
  constructor() {
    this.templates = [];
  }
  /**
   * Add a URI template to the matcher
   * @param {string} template - The URI template string to add
   * @throws {Error} If template is invalid
   */
  add(template) {
    if (typeof template !== "string") {
      throw new Error("Template must be a string");
    }
    if (template !== "" && template.trim() === "") {
      throw new Error("Template cannot be empty");
    }
    try {
      const parsed = parse_template(template);
      this.templates.push(parsed);
    } catch (error) {
      throw new Error(
        `Invalid template: ${template} - ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  /**
   * Match a URI against all registered templates
   * @param {string} uri - The URI to match
   * @returns {MatchResult | null} Match result or null if no match found
   * @throws {Error} If URI is invalid
   */
  match(uri) {
    if (typeof uri !== "string") {
      throw new Error("URI must be a string");
    }
    for (const template of this.templates) {
      const params = match_uri(uri, template);
      if (params !== null) {
        return {
          template: template.template,
          params
        };
      }
    }
    return null;
  }
  /**
   * Clear all registered templates
   */
  clear() {
    this.templates = [];
  }
  /**
   * Get all registered template strings
   * @returns {string[]} Array of template strings
   */
  all() {
    return this.templates.map((t) => t.template);
  }
};

// node_modules/.pnpm/valibot@1.5.0/node_modules/valibot/dist/index.mjs
var store$4;
var DEFAULT_CONFIG = {
  lang: void 0,
  message: void 0,
  abortEarly: void 0,
  abortPipeEarly: void 0
};
// @__NO_SIDE_EFFECTS__
function getGlobalConfig(config$1) {
  if (!config$1 && !store$4) return DEFAULT_CONFIG;
  return {
    lang: config$1?.lang ?? store$4?.lang,
    message: config$1?.message,
    abortEarly: config$1?.abortEarly ?? store$4?.abortEarly,
    abortPipeEarly: config$1?.abortPipeEarly ?? store$4?.abortPipeEarly
  };
}
var store$3;
// @__NO_SIDE_EFFECTS__
function getGlobalMessage(lang) {
  return store$3?.get(lang);
}
var store$2;
// @__NO_SIDE_EFFECTS__
function getSchemaMessage(lang) {
  return store$2?.get(lang);
}
var store$1;
// @__NO_SIDE_EFFECTS__
function getSpecificMessage(reference, lang) {
  return store$1?.get(reference)?.get(lang);
}
// @__NO_SIDE_EFFECTS__
function _stringify(input) {
  const type = typeof input;
  if (type === "string") return `"${input}"`;
  if (type === "number" || type === "bigint" || type === "boolean") return `${input}`;
  if (type === "object" || type === "function") return (input && Object.getPrototypeOf(input)?.constructor?.name) ?? "null";
  return type;
}
function _addIssue(context, label, dataset, config$1, other) {
  const input = other && "input" in other ? other.input : dataset.value;
  const expected = other?.expected ?? context.expects ?? null;
  const received = other?.received ?? /* @__PURE__ */ _stringify(input);
  const issue = {
    kind: context.kind,
    type: context.type,
    input,
    expected,
    received,
    message: `Invalid ${label}: ${expected ? `Expected ${expected} but r` : "R"}eceived ${received}`,
    requirement: context.requirement,
    path: other?.path,
    issues: other?.issues,
    lang: config$1.lang,
    abortEarly: config$1.abortEarly,
    abortPipeEarly: config$1.abortPipeEarly
  };
  const isSchema = context.kind === "schema";
  const message$1 = other?.message ?? context.message ?? /* @__PURE__ */ getSpecificMessage(context.reference, issue.lang) ?? (isSchema ? /* @__PURE__ */ getSchemaMessage(issue.lang) : null) ?? config$1.message ?? /* @__PURE__ */ getGlobalMessage(issue.lang);
  if (message$1 !== void 0) issue.message = typeof message$1 === "function" ? message$1(issue) : message$1;
  if (isSchema) dataset.typed = false;
  if (dataset.issues) dataset.issues.push(issue);
  else dataset.issues = [issue];
}
// @__NO_SIDE_EFFECTS__
function _isSameValueZero(value1, value2) {
  return value1 === value2 || Number.isNaN(value1) && Number.isNaN(value2);
}
// @__NO_SIDE_EFFECTS__
function _isValidObjectKey(object$1, key) {
  return Object.prototype.hasOwnProperty.call(object$1, key) && key !== "__proto__" && key !== "prototype" && key !== "constructor";
}
// @__NO_SIDE_EFFECTS__
function _joinExpects(values$1, separator) {
  const list = [...new Set(values$1)];
  if (list.length > 1) return `(${list.join(` ${separator} `)})`;
  return list[0] ?? "never";
}
function _standardSchema(schema) {
  schema["~standard"] = {
    version: 1,
    vendor: "valibot",
    validate: (value$1) => schema["~run"]({ value: value$1 }, /* @__PURE__ */ getGlobalConfig())
  };
  return schema;
}
// @__NO_SIDE_EFFECTS__
function getDotPath(issue) {
  if (issue.path) {
    let key = "";
    for (const item of issue.path) if (typeof item.key === "string" || typeof item.key === "number") if (key) key += `.${item.key}`;
    else key += item.key;
    else return null;
    return key;
  }
  return null;
}
var ValiError = class extends Error {
  /**
  * Creates a Valibot error with useful information.
  *
  * @param issues The error issues.
  */
  constructor(issues) {
    super(issues[0].message);
    this.name = "ValiError";
    this.issues = issues;
  }
};
var BASE64_REGEX = /^(?:[\da-z+/]{4})*(?:[\da-z+/]{2}==|[\da-z+/]{3}=)?$/iu;
var EMOJI_REGEX = new RegExp("^(?:[\\u{1F1E6}-\\u{1F1FF}]{2}|\\u{1F3F4}[\\u{E0061}-\\u{E007A}]{2}[\\u{E0030}-\\u{E0039}\\u{E0061}-\\u{E007A}]{1,3}\\u{E007F}|(?:\\p{Emoji}\\uFE0F\\u20E3?|\\p{Emoji_Modifier_Base}\\p{Emoji_Modifier}?|(?![\\p{Emoji_Modifier_Base}\\u{1F1E6}-\\u{1F1FF}])\\p{Emoji_Presentation})(?:\\u200D(?:\\p{Emoji}\\uFE0F\\u20E3?|\\p{Emoji_Modifier_Base}\\p{Emoji_Modifier}?|(?![\\p{Emoji_Modifier_Base}\\u{1F1E6}-\\u{1F1FF}])\\p{Emoji_Presentation}))*)+$", "u");
// @__NO_SIDE_EFFECTS__
function base64(message$1) {
  return {
    kind: "validation",
    type: "base64",
    reference: base64,
    async: false,
    expects: null,
    requirement: BASE64_REGEX,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "Base64", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function check(requirement, message$1) {
  return {
    kind: "validation",
    type: "check",
    reference: check,
    async: false,
    expects: null,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "input", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function description(description_) {
  return {
    kind: "metadata",
    type: "description",
    reference: description,
    description: description_
  };
}
// @__NO_SIDE_EFFECTS__
function integer(message$1) {
  return {
    kind: "validation",
    type: "integer",
    reference: integer,
    async: false,
    expects: null,
    requirement: Number.isInteger,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "integer", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function maxLength(requirement, message$1) {
  return {
    kind: "validation",
    type: "max_length",
    reference: maxLength,
    async: false,
    expects: `<=${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.length > this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function maxValue(requirement, message$1) {
  return {
    kind: "validation",
    type: "max_value",
    reference: maxValue,
    async: false,
    expects: `<=${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !(dataset.value <= this.requirement)) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function minLength(requirement, message$1) {
  return {
    kind: "validation",
    type: "min_length",
    reference: minLength,
    async: false,
    expects: `>=${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.length < this.requirement) _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function minValue(requirement, message$1) {
  return {
    kind: "validation",
    type: "min_value",
    reference: minValue,
    async: false,
    expects: `>=${requirement instanceof Date ? requirement.toJSON() : /* @__PURE__ */ _stringify(requirement)}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !(dataset.value >= this.requirement)) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function regex(requirement, message$1) {
  return {
    kind: "validation",
    type: "regex",
    reference: regex,
    async: false,
    expects: `${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "format", dataset, config$1);
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function startsWith(requirement, message$1) {
  return {
    kind: "validation",
    type: "starts_with",
    reference: startsWith,
    async: false,
    expects: `"${requirement}"`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !dataset.value.startsWith(this.requirement)) _addIssue(this, "start", dataset, config$1, { received: `"${dataset.value.slice(0, this.requirement.length)}"` });
      return dataset;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function url(message$1) {
  return {
    kind: "validation",
    type: "url",
    reference: url,
    async: false,
    expects: null,
    requirement(input) {
      try {
        if (URL.canParse) return URL.canParse(input);
        new URL(input);
        return true;
      } catch {
        return false;
      }
    },
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "URL", dataset, config$1);
      return dataset;
    }
  };
}
var ABORT_EARLY_CONFIG = { abortEarly: true };
// @__NO_SIDE_EFFECTS__
function getFallback(schema, dataset, config$1) {
  return typeof schema.fallback === "function" ? schema.fallback(dataset, config$1) : schema.fallback;
}
// @__NO_SIDE_EFFECTS__
function getDefault(schema, dataset, config$1) {
  return typeof schema.default === "function" ? schema.default(dataset, config$1) : schema.default;
}
// @__NO_SIDE_EFFECTS__
function array(item, message$1) {
  return _standardSchema({
    kind: "schema",
    type: "array",
    reference: array,
    expects: "Array",
    async: false,
    item,
    message: message$1,
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (Array.isArray(input)) {
        dataset.typed = true;
        dataset.value = [];
        for (let key = 0; key < input.length; key++) {
          const value$1 = input[key];
          const itemDataset = this.item["~run"]({ value: value$1 }, config$1);
          if (itemDataset.issues) {
            const pathItem = {
              type: "array",
              origin: "value",
              input,
              key,
              value: value$1
            };
            for (const issue of itemDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = itemDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!itemDataset.typed) dataset.typed = false;
          dataset.value.push(itemDataset.value);
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  });
}
// @__NO_SIDE_EFFECTS__
function boolean(message$1) {
  return _standardSchema({
    kind: "schema",
    type: "boolean",
    reference: boolean,
    expects: "boolean",
    async: false,
    message: message$1,
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "boolean") dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  });
}
// @__NO_SIDE_EFFECTS__
function custom(check$1, message$1) {
  return _standardSchema({
    kind: "schema",
    type: "custom",
    reference: custom,
    expects: "unknown",
    async: false,
    check: check$1,
    message: message$1,
    "~run"(dataset, config$1) {
      if (this.check(dataset.value)) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  });
}
// @__NO_SIDE_EFFECTS__
function literal(literal_, message$1) {
  return _standardSchema({
    kind: "schema",
    type: "literal",
    reference: literal,
    expects: /* @__PURE__ */ _stringify(literal_),
    async: false,
    literal: literal_,
    message: message$1,
    "~run"(dataset, config$1) {
      if (/* @__PURE__ */ _isSameValueZero(dataset.value, this.literal)) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  });
}
// @__NO_SIDE_EFFECTS__
function looseObject(entries$1, message$1) {
  return _standardSchema({
    kind: "schema",
    type: "loose_object",
    reference: looseObject,
    expects: "Object",
    async: false,
    entries: entries$1,
    message: message$1,
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const key in this.entries) {
          const valueSchema = this.entries[key];
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
            const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema);
            const valueDataset = valueSchema["~run"]({ value: value$1 }, config$1);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value$1
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) issue.path.unshift(pathItem);
                else issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) dataset.issues = valueDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) dataset.typed = false;
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
          else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config$1, {
              input: void 0,
              expected: `"${key}"`,
              path: [{
                type: "object",
                origin: "key",
                input,
                key,
                value: input[key]
              }]
            });
            if (config$1.abortEarly) break;
          }
        }
        if (!dataset.issues || !config$1.abortEarly) {
          for (const key in input) if (/* @__PURE__ */ _isValidObjectKey(input, key) && !Object.prototype.hasOwnProperty.call(this.entries, key)) dataset.value[key] = input[key];
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  });
}
// @__NO_SIDE_EFFECTS__
function nullable(wrapped, default_) {
  return _standardSchema({
    kind: "schema",
    type: "nullable",
    reference: nullable,
    expects: `(${wrapped.expects} | null)`,
    async: false,
    wrapped,
    default: default_,
    "~run"(dataset, config$1) {
      if (dataset.value === null) {
        if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
        if (dataset.value === null) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config$1);
    }
  });
}
// @__NO_SIDE_EFFECTS__
function number(message$1) {
  return _standardSchema({
    kind: "schema",
    type: "number",
    reference: number,
    expects: "number",
    async: false,
    message: message$1,
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "number" && !isNaN(dataset.value)) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  });
}
// @__NO_SIDE_EFFECTS__
function object(entries$1, message$1) {
  return _standardSchema({
    kind: "schema",
    type: "object",
    reference: object,
    expects: "Object",
    async: false,
    entries: entries$1,
    message: message$1,
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const key in this.entries) {
          const valueSchema = this.entries[key];
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
            const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema);
            const valueDataset = valueSchema["~run"]({ value: value$1 }, config$1);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value$1
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) issue.path.unshift(pathItem);
                else issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) dataset.issues = valueDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) dataset.typed = false;
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
          else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config$1, {
              input: void 0,
              expected: `"${key}"`,
              path: [{
                type: "object",
                origin: "key",
                input,
                key,
                value: input[key]
              }]
            });
            if (config$1.abortEarly) break;
          }
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  });
}
// @__NO_SIDE_EFFECTS__
function optional(wrapped, default_) {
  return _standardSchema({
    kind: "schema",
    type: "optional",
    reference: optional,
    expects: `(${wrapped.expects} | undefined)`,
    async: false,
    wrapped,
    default: default_,
    "~run"(dataset, config$1) {
      if (dataset.value === void 0) {
        if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
        if (dataset.value === void 0) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config$1);
    }
  });
}
// @__NO_SIDE_EFFECTS__
function picklist(options, message$1) {
  return _standardSchema({
    kind: "schema",
    type: "picklist",
    reference: picklist,
    expects: /* @__PURE__ */ _joinExpects(options.map(_stringify), "|"),
    async: false,
    options,
    message: message$1,
    "~run"(dataset, config$1) {
      if (this.options.includes(dataset.value)) dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  });
}
// @__NO_SIDE_EFFECTS__
function record(key, value$1, message$1) {
  return _standardSchema({
    kind: "schema",
    type: "record",
    reference: record,
    expects: "Object",
    async: false,
    key,
    value: value$1,
    message: message$1,
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const entryKey in input) if (/* @__PURE__ */ _isValidObjectKey(input, entryKey)) {
          const entryValue = input[entryKey];
          const keyDataset = this.key["~run"]({ value: entryKey }, config$1);
          if (keyDataset.issues) {
            const pathItem = {
              type: "object",
              origin: "key",
              input,
              key: entryKey,
              value: entryValue
            };
            for (const issue of keyDataset.issues) {
              issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = keyDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          const valueDataset = this.value["~run"]({ value: entryValue }, config$1);
          if (valueDataset.issues) {
            const pathItem = {
              type: "object",
              origin: "value",
              input,
              key: entryKey,
              value: entryValue
            };
            for (const issue of valueDataset.issues) {
              if (issue.path) issue.path.unshift(pathItem);
              else issue.path = [pathItem];
              dataset.issues?.push(issue);
            }
            if (!dataset.issues) dataset.issues = valueDataset.issues;
            if (config$1.abortEarly) {
              dataset.typed = false;
              break;
            }
          }
          if (!keyDataset.typed || !valueDataset.typed) dataset.typed = false;
          if (keyDataset.typed) dataset.value[keyDataset.value] = valueDataset.value;
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  });
}
// @__NO_SIDE_EFFECTS__
function strictObject(entries$1, message$1) {
  return _standardSchema({
    kind: "schema",
    type: "strict_object",
    reference: strictObject,
    expects: "Object",
    async: false,
    entries: entries$1,
    message: message$1,
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const key in this.entries) {
          const valueSchema = this.entries[key];
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
            const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema);
            const valueDataset = valueSchema["~run"]({ value: value$1 }, config$1);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value$1
              };
              for (const issue of valueDataset.issues) {
                if (issue.path) issue.path.unshift(pathItem);
                else issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues) dataset.issues = valueDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed) dataset.typed = false;
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== void 0) dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
          else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config$1, {
              input: void 0,
              expected: `"${key}"`,
              path: [{
                type: "object",
                origin: "key",
                input,
                key,
                value: input[key]
              }]
            });
            if (config$1.abortEarly) break;
          }
        }
        if (!dataset.issues || !config$1.abortEarly) {
          for (const key in input) if (!Object.prototype.hasOwnProperty.call(this.entries, key)) {
            _addIssue(this, "key", dataset, config$1, {
              input: key,
              expected: "never",
              path: [{
                type: "object",
                origin: "key",
                input,
                key,
                value: input[key]
              }]
            });
            break;
          }
        }
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  });
}
// @__NO_SIDE_EFFECTS__
function string(message$1) {
  return _standardSchema({
    kind: "schema",
    type: "string",
    reference: string,
    expects: "string",
    async: false,
    message: message$1,
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "string") dataset.typed = true;
      else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  });
}
// @__NO_SIDE_EFFECTS__
function _subIssues(datasets) {
  let issues;
  if (datasets) for (const dataset of datasets) if (issues) for (const issue of dataset.issues) issues.push(issue);
  else issues = dataset.issues;
  return issues;
}
// @__NO_SIDE_EFFECTS__
function union(options, message$1) {
  return _standardSchema({
    kind: "schema",
    type: "union",
    reference: union,
    expects: /* @__PURE__ */ _joinExpects(options.map((option) => option.expects), "|"),
    async: false,
    options,
    message: message$1,
    "~run"(dataset, config$1) {
      let validDataset;
      let typedDatasets;
      let untypedDatasets;
      for (const schema of this.options) {
        const optionDataset = schema["~run"]({ value: dataset.value }, config$1);
        if (optionDataset.typed) if (optionDataset.issues) if (typedDatasets) typedDatasets.push(optionDataset);
        else typedDatasets = [optionDataset];
        else {
          validDataset = optionDataset;
          break;
        }
        else if (untypedDatasets) untypedDatasets.push(optionDataset);
        else untypedDatasets = [optionDataset];
      }
      if (validDataset) return validDataset;
      if (typedDatasets) {
        if (typedDatasets.length === 1) return typedDatasets[0];
        _addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(typedDatasets) });
        dataset.typed = true;
      } else if (untypedDatasets?.length === 1) return untypedDatasets[0];
      else _addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(untypedDatasets) });
      return dataset;
    }
  });
}
// @__NO_SIDE_EFFECTS__
function unknown() {
  return _standardSchema({
    kind: "schema",
    type: "unknown",
    reference: unknown,
    expects: "unknown",
    async: false,
    "~run"(dataset) {
      dataset.typed = true;
      return dataset;
    }
  });
}
// @__NO_SIDE_EFFECTS__
function variant(key, options, message$1) {
  return _standardSchema({
    kind: "schema",
    type: "variant",
    reference: variant,
    expects: "Object",
    async: false,
    key,
    options,
    message: message$1,
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        let outputDataset;
        let maxDiscriminatorPriority = 0;
        let invalidDiscriminatorKey = this.key;
        let expectedDiscriminators = [];
        const parseOptions = (variant$1, allKeys) => {
          for (const schema of variant$1.options) {
            if (schema.type === "variant") parseOptions(schema, new Set(allKeys).add(schema.key));
            else {
              let keysAreValid = true;
              let currentPriority = 0;
              for (const currentKey of allKeys) {
                const discriminatorSchema = schema.entries[currentKey];
                if (currentKey in input ? discriminatorSchema["~run"]({
                  typed: false,
                  value: input[currentKey]
                }, ABORT_EARLY_CONFIG).issues : discriminatorSchema.type !== "exact_optional" && discriminatorSchema.type !== "optional" && discriminatorSchema.type !== "nullish") {
                  keysAreValid = false;
                  if (invalidDiscriminatorKey !== currentKey && (maxDiscriminatorPriority < currentPriority || maxDiscriminatorPriority === currentPriority && currentKey in input && !(invalidDiscriminatorKey in input))) {
                    maxDiscriminatorPriority = currentPriority;
                    invalidDiscriminatorKey = currentKey;
                    expectedDiscriminators = [];
                  }
                  if (invalidDiscriminatorKey === currentKey) expectedDiscriminators.push(schema.entries[currentKey].expects);
                  break;
                }
                currentPriority++;
              }
              if (keysAreValid) {
                const optionDataset = schema["~run"]({ value: input }, config$1);
                if (!outputDataset || !outputDataset.typed && optionDataset.typed) outputDataset = optionDataset;
              }
            }
            if (outputDataset && !outputDataset.issues) break;
          }
        };
        parseOptions(this, /* @__PURE__ */ new Set([this.key]));
        if (outputDataset) return outputDataset;
        _addIssue(this, "type", dataset, config$1, {
          input: input[invalidDiscriminatorKey],
          expected: /* @__PURE__ */ _joinExpects(expectedDiscriminators, "|"),
          path: [{
            type: "object",
            origin: "value",
            input,
            key: invalidDiscriminatorKey,
            value: input[invalidDiscriminatorKey]
          }]
        });
      } else _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  });
}
function parse(schema, input, config$1) {
  const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config$1));
  if (dataset.issues) throw new ValiError(dataset.issues);
  return dataset.value;
}
// @__NO_SIDE_EFFECTS__
function pipe(...pipe$1) {
  return _standardSchema({
    ...pipe$1[0],
    pipe: pipe$1,
    "~run"(dataset, config$1) {
      for (const item of pipe$1) if (item.kind !== "metadata") {
        if (dataset.issues && (item.kind === "schema" || item.kind === "transformation")) {
          dataset.typed = false;
          break;
        }
        if (!dataset.issues || !config$1.abortEarly && !config$1.abortPipeEarly) dataset = item["~run"](dataset, config$1);
      }
      return dataset;
    }
  });
}
// @__NO_SIDE_EFFECTS__
function safeParse(schema, input, config$1) {
  const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config$1));
  return {
    typed: dataset.typed,
    success: !dataset.issues,
    output: dataset.value,
    issues: dataset.issues
  };
}
// @__NO_SIDE_EFFECTS__
function summarize(issues) {
  let summary = "";
  for (const issue of issues) {
    if (summary) summary += "\n";
    summary += `\xD7 ${issue.message}`;
    const dotPath = /* @__PURE__ */ getDotPath(issue);
    if (dotPath) summary += `
  \u2192 at ${dotPath}`;
  }
  return summary;
}

// node_modules/.pnpm/tmcp@1.20.0/node_modules/tmcp/src/validation/index.js
var import_json_rpc_2 = __toESM(require_dist(), 1);

// node_modules/.pnpm/tmcp@1.20.0/node_modules/tmcp/src/validation/version.js
var SUPPORTED_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
var LATEST_PROTOCOL_VERSION = SUPPORTED_VERSIONS[0];
var MODERN_PROTOCOL_VERSION = "2026-07-28";
var KNOWN_PER_REQUEST_PROTOCOL_VERSIONS = [MODERN_PROTOCOL_VERSION];
var ProtocolVersionSchema = pipe(
  string(),
  regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Protocol version must be in YYYY-MM-DD format"
  )
);
var SupportedProtocolVersionSchema = pipe(
  ProtocolVersionSchema,
  check(
    (version2) => SUPPORTED_VERSIONS.includes(version2),
    "Unsupported protocol version"
  )
);
function is_supported_version(version2) {
  return SUPPORTED_VERSIONS.includes(version2);
}
function get_latest_version() {
  return LATEST_PROTOCOL_VERSION;
}
function get_supported_versions() {
  return [...SUPPORTED_VERSIONS];
}
function negotiate_protocol_version(client_version) {
  if (is_supported_version(client_version)) {
    return client_version;
  }
  return get_latest_version();
}
function should_version_negotiation_fail(client_version) {
  try {
    const date = new Date(client_version);
    const regex3 = /^\d{4}-\d{2}-\d{2}$/;
    return !regex3.test(client_version) || isNaN(date.getTime());
  } catch {
    return true;
  }
}

// node_modules/.pnpm/tmcp@1.20.0/node_modules/tmcp/src/validation/index.js
var JSONRPC_VERSION = "2.0";
var MISSING_REQUIRED_CLIENT_CAPABILITY = -32021;
var UNSUPPORTED_PROTOCOL_VERSION = -32022;
var SUBSCRIPTION_ID_META_KEY = "io.modelcontextprotocol/subscriptionId";
var McpError = class extends import_json_rpc_2.JSONRPCErrorException {
  /**
   * @param {number} code
   * @param {string} message
   * @param {unknown} [data]
   */
  constructor(code, message, data) {
    super(`MCP error ${code}: ${message}`, code, data);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "McpError";
  }
};
function missing_required_client_capability_error(required_capabilities) {
  return new McpError(
    MISSING_REQUIRED_CLIENT_CAPABILITY,
    `Missing required client capability: ${Object.keys(required_capabilities).join(", ")}`,
    { requiredCapabilities: required_capabilities }
  );
}
function unsupported_protocol_version_error(supported, requested) {
  return new McpError(
    UNSUPPORTED_PROTOCOL_VERSION,
    `Unsupported protocol version: ${requested}`,
    { supported, requested }
  );
}
var RequestIdSchema = union([
  string(),
  pipe(number(), integer())
]);
var LoggingLevelSchema = picklist([
  "debug",
  "info",
  "notice",
  "warning",
  "error",
  "critical",
  "alert",
  "emergency"
]);
var ProgressTokenSchema = union([
  string(),
  pipe(number(), integer())
]);
var CursorSchema = string();
var RequestMetaSchema = looseObject({
  /**
   * If specified, the caller is requesting out-of-band progress notifications for this request (as represented by notifications/progress). The value of this parameter is an opaque token that will be attached to any subsequent notifications. The receiver is not obligated to provide these notifications.
   */
  progressToken: optional(ProgressTokenSchema)
});
var BaseRequestParamsSchema = looseObject({
  _meta: optional(RequestMetaSchema)
});
var RequestSchema = object({
  method: string(),
  params: optional(BaseRequestParamsSchema)
});
var NotificationMetaSchema = looseObject({});
var SubscriptionNotificationMetaSchema = looseObject({
  [SUBSCRIPTION_ID_META_KEY]: optional(RequestIdSchema)
});
var BaseNotificationParamsSchema = looseObject({
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(NotificationMetaSchema)
});
var SubscriptionNotificationParamsSchema = looseObject({
  _meta: optional(SubscriptionNotificationMetaSchema)
});
var NotificationSchema = object({
  method: string(),
  params: optional(BaseNotificationParamsSchema)
});
var ResultSchema = looseObject({
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({}))
});
var JSONRPCRequestSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  ...RequestSchema.entries
});
var JSONRPCNotificationSchema = object({
  jsonrpc: literal(JSONRPC_VERSION),
  ...NotificationSchema.entries
});
var JSONRPCResponseSchema = strictObject({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  result: ResultSchema
});
var JSONRPCErrorSchema = strictObject({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  error: object({
    /**
     * The error type that occurred.
     */
    code: pipe(number(), integer()),
    /**
     * A short description of the error. The message SHOULD be limited to a concise single sentence.
     */
    message: string(),
    /**
     * Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.).
     */
    data: optional(unknown())
  })
});
var JSONRPCMessageSchema = union([
  JSONRPCRequestSchema,
  JSONRPCNotificationSchema,
  JSONRPCResponseSchema,
  JSONRPCErrorSchema
]);
var EmptyResultSchema = strictObject({ ...ResultSchema.entries });
var CancelledNotificationSchema = object({
  ...NotificationSchema.entries,
  method: literal("notifications/cancelled"),
  params: object({
    ...BaseNotificationParamsSchema.entries,
    /**
     * The ID of the request to cancel.
     *
     * This MUST correspond to the ID of a request previously issued in the same direction.
     */
    requestId: RequestIdSchema,
    /**
     * An optional string describing the reason for the cancellation. This MAY be logged or presented to the user.
     */
    reason: optional(string())
  })
});
var BaseMetadataSchema = object({
  /** Intended for programmatic or logical use, but used as a display name in past specs or fallback */
  name: string(),
  /**
   * Intended for UI and end-user contexts — optimized to be human-readable and easily understood,
   * even by those unfamiliar with domain-specific terminology.
   *
   * If not provided, the name should be used for display (except for Tool,
   * where `annotations.title` should be given precedence over using `name`,
   * if present).
   */
  title: optional(string())
});
var IconSchema = object({
  /**
   * URL or data URI for the icon.
   */
  src: string(),
  /**
   * Optional MIME type for the icon.
   */
  mimeType: optional(string()),
  /**
   * Optional array of strings that specify sizes at which the icon can be used.
   * Each string should be in WxH format (e.g., `"48x48"`, `"96x96"`) or `"any"` for scalable formats like SVG.
   *
   * If not provided, the client should assume that the icon can be used at any size.
   */
  sizes: optional(array(string()))
});
var IconsSchema = object({
  /**
   * Optional set of sized icons that the client can display in a user interface.
   *
   * Clients that support rendering icons MUST support at least the following MIME types:
   * - `image/png` - PNG images (safe, universal compatibility)
   * - `image/jpeg` (and `image/jpg`) - JPEG images (safe, universal compatibility)
   *
   * Clients that support rendering icons SHOULD also support:
   * - `image/svg+xml` - SVG images (scalable but requires security precautions)
   * - `image/webp` - WebP images (modern, efficient format)
   */
  icons: optional(array(IconSchema))
});
var ImplementationSchema = object({
  ...BaseMetadataSchema.entries,
  version: string(),
  websiteUrl: optional(string()),
  ...IconsSchema.entries
});
var ClientCapabilitiesSchema = looseObject({
  /**
   * Experimental, non-standard capabilities that the client supports.
   */
  experimental: optional(looseObject({})),
  /**
   * Present if the client supports sampling from an LLM.
   * @deprecated in the per-request (2026-07-28) protocol; still fully supported for session-negotiated clients.
   */
  sampling: optional(looseObject({})),
  /**
   * Present if the client supports eliciting user input.
   * Accepts both the legacy bare `{}` shape and the modern `{ form?, url? }` sub-shapes.
   */
  elicitation: optional(
    looseObject({
      form: optional(looseObject({})),
      url: optional(looseObject({}))
    })
  ),
  /**
   * Extensions supported by the client, keyed by prefixed extension identifier.
   */
  extensions: optional(record(string(), looseObject({}))),
  /**
   * Present if the client supports listing roots.
   * @deprecated in the per-request (2026-07-28) protocol; still fully supported for session-negotiated clients.
   */
  roots: optional(
    looseObject({
      /**
       * Whether the client supports issuing notifications for changes to the roots list.
       */
      listChanged: optional(boolean())
    })
  )
});
var InitializeRequestParamsSchema = object({
  ...BaseRequestParamsSchema.entries,
  /**
   * The latest version of the Model Context Protocol that the client supports. The client MAY decide to support older versions as well.
   */
  protocolVersion: string(),
  capabilities: ClientCapabilitiesSchema,
  clientInfo: ImplementationSchema
});
var InitializeRequestSchema = object({
  ...RequestSchema.entries,
  method: literal("initialize"),
  params: InitializeRequestParamsSchema
});
var ServerCapabilitiesSchema = object({
  /**
   * Experimental, non-standard capabilities that the server supports.
   */
  experimental: optional(object({})),
  /**
   * Present if the server supports sending log messages to the client.
   * @deprecated in the per-request (2026-07-28) protocol; still fully supported for session-negotiated clients.
   */
  logging: optional(object({})),
  /**
   * Extensions supported by the server, keyed by prefixed extension identifier.
   */
  extensions: optional(record(string(), looseObject({}))),
  /**
   * Present if the server supports sending completions to the client.
   */
  completions: optional(object({})),
  /**
   * Present if the server offers any prompt templates.
   */
  prompts: optional(
    object({
      /**
       * Whether this server supports issuing notifications for changes to the prompt list.
       */
      listChanged: optional(boolean())
    })
  ),
  /**
   * Present if the server offers any resources to read.
   */
  resources: optional(
    object({
      /**
       * Whether this server supports clients subscribing to resource updates.
       */
      subscribe: optional(boolean()),
      /**
       * Whether this server supports issuing notifications for changes to the resource list.
       */
      listChanged: optional(boolean())
    })
  ),
  /**
   * Present if the server offers any tools to call.
   */
  tools: optional(
    object({
      /**
       * Whether this server supports issuing notifications for changes to the tool list.
       */
      listChanged: optional(boolean())
    })
  )
});
var InitializeResultSchema = object({
  ...ResultSchema.entries,
  /**
   * The version of the Model Context Protocol that the server wants to use. This may not match the version that the client requested. If the client cannot support this version, it MUST disconnect.
   */
  protocolVersion: string(),
  capabilities: ServerCapabilitiesSchema,
  serverInfo: ImplementationSchema,
  /**
   * Instructions describing how to use the server and its features.
   *
   * This can be used by clients to improve the LLM's understanding of available tools, resources, etc. It can be thought of like a "hint" to the model. For example, this information MAY be added to the system prompt.
   */
  instructions: optional(string())
});
var InitializedNotificationSchema = object({
  ...NotificationSchema.entries,
  method: literal("notifications/initialized")
});
var PingRequestSchema = object({
  ...RequestSchema.entries,
  method: literal("ping")
});
var ProgressSchema = object({
  /**
   * The progress thus far. This should increase every time progress is made, even if the total is unknown.
   */
  progress: number(),
  /**
   * Total number of items to process (or total progress required), if known.
   */
  total: optional(number()),
  /**
   * An optional message describing the current progress.
   */
  message: optional(string())
});
var ProgressNotificationSchema = object({
  ...NotificationSchema.entries,
  method: literal("notifications/progress"),
  params: object({
    ...BaseNotificationParamsSchema.entries,
    ...ProgressSchema.entries,
    /**
     * The progress token which was given in the initial request, used to associate this notification with the request that is proceeding.
     */
    progressToken: ProgressTokenSchema
  })
});
var PaginatedRequestSchema = object({
  ...RequestSchema.entries,
  params: optional(
    object({
      ...BaseRequestParamsSchema.entries,
      /**
       * An opaque token representing the current pagination position.
       * If provided, the server should return results starting after this cursor.
       */
      cursor: optional(CursorSchema)
    })
  )
});
var PaginatedResultSchema = object({
  ...ResultSchema.entries,
  /**
   * An opaque token representing the pagination position after the last returned result.
   * If present, there may be more results available.
   */
  nextCursor: optional(CursorSchema)
});
var ResourceContentsSchema = object({
  /**
   * The URI of this resource.
   */
  uri: string(),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: optional(string()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({}))
});
var TextResourceContentsSchema = object({
  ...ResourceContentsSchema.entries,
  /**
   * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
   */
  text: string()
});
var BlobResourceContentsSchema = object({
  ...ResourceContentsSchema.entries,
  /**
   * A base64-encoded string representing the binary data of the item.
   */
  blob: pipe(string(), base64())
});
var ResourceSchema = object({
  ...BaseMetadataSchema.entries,
  /**
   * The URI of this resource.
   */
  uri: string(),
  /**
   * A description of what this resource represents.
   *
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description: optional(string()),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: optional(string()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({})),
  ...IconsSchema.entries
});
var ResourceTemplateSchema = object({
  ...BaseMetadataSchema.entries,
  /**
   * A URI template (according to RFC 6570) that can be used to construct resource URIs.
   */
  uriTemplate: string(),
  /**
   * A description of what this template is for.
   *
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description: optional(string()),
  /**
   * The MIME type for all resources that match this template. This should only be included if all resources matching this template have the same type.
   */
  mimeType: optional(string()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({})),
  ...IconsSchema.entries
});
var ListResourcesRequestSchema = object({
  ...PaginatedRequestSchema.entries,
  method: literal("resources/list")
});
var ListResourcesResultSchema = object({
  ...PaginatedResultSchema.entries,
  resources: array(ResourceSchema)
});
var ListResourceTemplatesRequestSchema = object({
  ...PaginatedRequestSchema.entries,
  method: literal("resources/templates/list")
});
var ListResourceTemplatesResultSchema = object({
  ...PaginatedResultSchema.entries,
  resourceTemplates: array(ResourceTemplateSchema)
});
var ReadResourceRequestSchema = object({
  ...RequestSchema.entries,
  method: literal("resources/read"),
  params: object({
    ...BaseRequestParamsSchema.entries,
    /**
     * The URI of the resource to read. The URI can use any protocol; it is up to the server how to interpret it.
     */
    uri: string()
  })
});
var ReadResourceResultSchema = looseObject({
  ...ResultSchema.entries,
  contents: array(
    union([TextResourceContentsSchema, BlobResourceContentsSchema])
  )
});
var ResourceListChangedNotificationSchema = object({
  ...NotificationSchema.entries,
  method: literal("notifications/resources/list_changed"),
  params: optional(SubscriptionNotificationParamsSchema)
});
var SubscriptionFilterSchema = object({
  toolsListChanged: optional(boolean()),
  promptsListChanged: optional(boolean()),
  resourcesListChanged: optional(boolean()),
  resourceSubscriptions: optional(array(string()))
});
var PerRequestMetaSchema = looseObject({
  ...RequestMetaSchema.entries,
  "io.modelcontextprotocol/protocolVersion": string(),
  "io.modelcontextprotocol/clientCapabilities": ClientCapabilitiesSchema,
  "io.modelcontextprotocol/clientInfo": optional(ImplementationSchema),
  "io.modelcontextprotocol/logLevel": optional(LoggingLevelSchema)
});
var DiscoverRequestParamsSchema = looseObject({
  _meta: PerRequestMetaSchema
});
var SubscriptionsListenRequestParamsSchema = object({
  ...BaseRequestParamsSchema.entries,
  _meta: PerRequestMetaSchema,
  notifications: SubscriptionFilterSchema
});
var SubscriptionsListenRequestSchema = object({
  ...RequestSchema.entries,
  method: literal("subscriptions/listen"),
  params: SubscriptionsListenRequestParamsSchema
});
var SubscriptionsListenResultSchema = looseObject({
  ...ResultSchema.entries,
  resultType: literal("complete"),
  _meta: looseObject({
    [SUBSCRIPTION_ID_META_KEY]: RequestIdSchema
  })
});
var SubscriptionsAcknowledgedNotificationSchema = object({
  ...NotificationSchema.entries,
  method: literal("notifications/subscriptions/acknowledged"),
  params: object({
    ...SubscriptionNotificationParamsSchema.entries,
    _meta: looseObject({
      [SUBSCRIPTION_ID_META_KEY]: RequestIdSchema
    }),
    notifications: SubscriptionFilterSchema
  })
});
var SubscribeRequestSchema = object({
  ...RequestSchema.entries,
  method: literal("resources/subscribe"),
  params: object({
    ...BaseRequestParamsSchema.entries,
    /**
     * The URI of the resource to subscribe to. The URI can use any protocol; it is up to the server how to interpret it.
     */
    uri: string()
  })
});
var UnsubscribeRequestSchema = object({
  ...RequestSchema.entries,
  method: literal("resources/unsubscribe"),
  params: object({
    ...BaseRequestParamsSchema.entries,
    /**
     * The URI of the resource to unsubscribe from.
     */
    uri: string()
  })
});
var ResourceUpdatedNotificationSchema = object({
  ...NotificationSchema.entries,
  method: literal("notifications/resources/updated"),
  params: object({
    ...SubscriptionNotificationParamsSchema.entries,
    /**
     * The URI of the resource that has been updated. This might be a sub-resource of the one that the client actually subscribed to.
     */
    uri: string()
  })
});
var PromptArgumentSchema = object({
  /**
   * The name of the argument.
   */
  name: string(),
  /**
   * A human-readable description of the argument.
   */
  description: optional(string()),
  /**
   * Whether this argument must be provided.
   */
  required: optional(boolean())
});
var PromptSchema = object({
  ...BaseMetadataSchema.entries,
  /**
   * An optional description of what this prompt provides
   */
  description: optional(string()),
  /**
   * A list of arguments to use for templating the prompt.
   */
  arguments: optional(array(PromptArgumentSchema)),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({})),
  ...IconsSchema.entries
});
var ListPromptsRequestSchema = object({
  ...PaginatedRequestSchema.entries,
  method: literal("prompts/list")
});
var ListPromptsResultSchema = object({
  ...PaginatedResultSchema.entries,
  prompts: array(PromptSchema)
});
var GetPromptRequestSchema = object({
  ...RequestSchema.entries,
  method: literal("prompts/get"),
  params: object({
    ...BaseRequestParamsSchema.entries,
    /**
     * The name of the prompt or prompt template.
     */
    name: string(),
    /**
     * Arguments to use for templating the prompt.
     */
    arguments: optional(record(string(), string()))
  })
});
var TextContentSchema = object({
  type: literal("text"),
  /**
   * The text content of the message.
   */
  text: string(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({}))
});
var ImageContentSchema = object({
  type: literal("image"),
  /**
   * The base64-encoded image data.
   */
  data: pipe(string(), base64()),
  /**
   * The MIME type of the image. Different providers may support different image types.
   */
  mimeType: string(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({}))
});
var AudioContentSchema = object({
  type: literal("audio"),
  /**
   * The base64-encoded audio data.
   */
  data: pipe(string(), base64()),
  /**
   * The MIME type of the audio. Different providers may support different audio types.
   */
  mimeType: string(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({}))
});
var EmbeddedResourceSchema = object({
  type: literal("resource"),
  resource: union([TextResourceContentsSchema, BlobResourceContentsSchema]),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({}))
});
var ResourceLinkSchema = object({
  ...ResourceSchema.entries,
  type: literal("resource_link")
});
var ContentBlockSchema = union([
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ResourceLinkSchema,
  EmbeddedResourceSchema
]);
var PromptMessageSchema = object({
  role: picklist(["user", "assistant"]),
  content: ContentBlockSchema
});
var GetPromptResultSchema = looseObject({
  ...ResultSchema.entries,
  /**
   * An optional description for the prompt.
   */
  description: optional(string()),
  messages: array(PromptMessageSchema)
});
var PromptListChangedNotificationSchema = object({
  ...NotificationSchema.entries,
  method: literal("notifications/prompts/list_changed"),
  params: optional(SubscriptionNotificationParamsSchema)
});
var ToolAnnotationsSchema = object({
  /**
   * A human-readable title for the tool.
   */
  title: optional(string()),
  /**
   * If true, the tool does not modify its environment.
   *
   * Default: false
   */
  readOnlyHint: optional(boolean()),
  /**
   * If true, the tool may perform destructive updates to its environment.
   * If false, the tool performs only additive updates.
   *
   * (This property is meaningful only when `readOnlyHint == false`)
   *
   * Default: true
   */
  destructiveHint: optional(boolean()),
  /**
   * If true, calling the tool repeatedly with the same arguments
   * will have no additional effect on the its environment.
   *
   * (This property is meaningful only when `readOnlyHint == false`)
   *
   * Default: false
   */
  idempotentHint: optional(boolean()),
  /**
   * If true, this tool may interact with an "open world" of external
   * entities. If false, the tool's domain of interaction is closed.
   * For example, the world of a web search tool is open, whereas that
   * of a memory tool is not.
   *
   * Default: true
   */
  openWorldHint: optional(boolean())
});
var ToolSchema = object({
  ...BaseMetadataSchema.entries,
  /**
   * A human-readable description of the tool.
   */
  description: optional(string()),
  /**
   * A JSON Schema object defining the expected parameters for the tool.
   * Any JSON Schema 2020-12 keywords are allowed alongside the required `type: "object"` root.
   */
  inputSchema: looseObject({
    $schema: optional(string()),
    type: literal("object")
  }),
  /**
   * An optional JSON Schema object defining the structure of the tool's output returned in
   * the structuredContent field of a CallToolResult. Any JSON Schema 2020-12 keywords are allowed.
   */
  outputSchema: optional(
    looseObject({
      $schema: optional(string())
    })
  ),
  /**
   * Optional additional tool information.
   */
  annotations: optional(ToolAnnotationsSchema),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({})),
  ...IconsSchema.entries
});
var ListToolsRequestSchema = object({
  ...PaginatedRequestSchema.entries,
  method: literal("tools/list")
});
var ListToolsResultSchema = object({
  ...PaginatedResultSchema.entries,
  tools: array(ToolSchema)
});
var CallToolResultSchema = looseObject({
  ...ResultSchema.entries,
  /**
   * A list of content objects that represent the result of the tool call.
   *
   * If the Tool does not define an outputSchema, this field MUST be present in the result.
   * For backwards compatibility, this field is always present, but it may be empty.
   */
  content: optional(array(ContentBlockSchema), []),
  /**
   * Structured tool output. May be ANY JSON value, not only objects.
   *
   * If the Tool defines an outputSchema, this field MUST be present in the result and match the schema.
   */
  structuredContent: optional(unknown()),
  /**
   * Whether the tool call ended in an error.
   *
   * If not set, this is assumed to be false (the call was successful).
   *
   * Any errors that originate from the tool SHOULD be reported inside the result
   * object, with `isError` set to true, _not_ as an MCP protocol-level error
   * response. Otherwise, the LLM would not be able to see that an error occurred
   * and self-correct.
   *
   * However, any errors in _finding_ the tool, an error indicating that the
   * server does not support tool calls, or any other exceptional conditions,
   * should be reported as an MCP error response.
   */
  isError: optional(boolean())
});
var CompatibilityCallToolResultSchema = union([
  CallToolResultSchema,
  object({ ...ResultSchema.entries, toolResult: unknown() })
]);
var CallToolRequestSchema = object({
  ...RequestSchema.entries,
  method: literal("tools/call"),
  params: object({
    ...BaseRequestParamsSchema.entries,
    name: string(),
    arguments: optional(record(string(), unknown()))
  })
});
var ToolListChangedNotificationSchema = object({
  ...NotificationSchema.entries,
  method: literal("notifications/tools/list_changed"),
  params: optional(SubscriptionNotificationParamsSchema)
});
var SetLevelRequestSchema = object({
  ...RequestSchema.entries,
  method: literal("logging/setLevel"),
  params: object({
    ...BaseRequestParamsSchema.entries,
    /**
     * The level of logging that the client wants to receive from the server. The server should send all logs at this level and higher (i.e., more severe) to the client as notifications/logging/message.
     */
    level: LoggingLevelSchema
  })
});
var LoggingMessageNotificationSchema = object({
  ...NotificationSchema.entries,
  method: literal("notifications/message"),
  params: object({
    ...BaseNotificationParamsSchema.entries,
    /**
     * The severity of this log message.
     */
    level: LoggingLevelSchema,
    /**
     * An optional name of the logger issuing this message.
     */
    logger: optional(string()),
    /**
     * The data to be logged, such as a string message or an object. Any JSON serializable type is allowed here.
     */
    data: unknown()
  })
});
var ModelHintSchema = object({
  /**
   * A hint for a model name.
   */
  name: optional(string())
});
var ModelPreferencesSchema = object({
  /**
   * Optional hints to use for model selection.
   */
  hints: optional(array(ModelHintSchema)),
  /**
   * How much to prioritize cost when selecting a model.
   */
  costPriority: optional(pipe(number(), minValue(0), maxValue(1))),
  /**
   * How much to prioritize sampling speed (latency) when selecting a model.
   */
  speedPriority: optional(pipe(number(), minValue(0), maxValue(1))),
  /**
   * How much to prioritize intelligence and capabilities when selecting a model.
   */
  intelligencePriority: optional(
    pipe(number(), minValue(0), maxValue(1))
  )
});
var SamplingMessageSchema = object({
  role: picklist(["user", "assistant"]),
  content: union([
    TextContentSchema,
    ImageContentSchema,
    AudioContentSchema
  ])
});
var CreateMessageRequestParamsSchema = object({
  ...BaseRequestParamsSchema.entries,
  messages: array(SamplingMessageSchema),
  /**
   * An optional system prompt the server wants to use for sampling. The client MAY modify or omit this prompt.
   */
  systemPrompt: optional(string()),
  /**
   * A request to include context from one or more MCP servers (including the caller), to be attached to the prompt. The client MAY ignore this request.
   */
  includeContext: optional(
    picklist(["none", "thisServer", "allServers"])
  ),
  temperature: optional(number()),
  /**
   * The maximum number of tokens to sample, as requested by the server. The client MAY choose to sample fewer tokens than requested.
   */
  maxTokens: pipe(number(), integer()),
  stopSequences: optional(array(string())),
  /**
   * Optional metadata to pass through to the LLM provider. The format of this metadata is provider-specific.
   */
  metadata: optional(object({})),
  /**
   * The server's preferences for which model to select.
   */
  modelPreferences: optional(ModelPreferencesSchema)
});
var CreateMessageRequestSchema = object({
  ...RequestSchema.entries,
  method: literal("sampling/createMessage"),
  params: CreateMessageRequestParamsSchema
});
var CreateMessageResultSchema = object({
  ...ResultSchema.entries,
  /**
   * The name of the model that generated the message.
   */
  model: string(),
  /**
   * The reason why sampling stopped.
   */
  stopReason: optional(
    union([
      picklist(["endTurn", "stopSequence", "maxTokens"]),
      string()
    ])
  ),
  role: picklist(["user", "assistant"]),
  content: variant("type", [
    TextContentSchema,
    ImageContentSchema,
    AudioContentSchema
  ])
});
var BooleanSchemaSchema = object({
  type: literal("boolean"),
  title: optional(string()),
  description: optional(string()),
  default: optional(boolean())
});
var StringSchemaSchema = object({
  type: literal("string"),
  title: optional(string()),
  description: optional(string()),
  minLength: optional(number()),
  maxLength: optional(number()),
  format: optional(picklist(["email", "uri", "date", "date-time"])),
  default: optional(string())
});
var NumberSchemaSchema = object({
  type: picklist(["number", "integer"]),
  title: optional(string()),
  description: optional(string()),
  minimum: optional(number()),
  maximum: optional(number()),
  default: optional(number())
});
var TitledEnumOptionSchema = object({
  const: string(),
  title: string()
});
var UntitledSingleSelectEnumSchema = object({
  type: literal("string"),
  title: optional(string()),
  description: optional(string()),
  enum: array(string()),
  default: optional(string())
});
var TitledSingleSelectEnumSchema = object({
  type: literal("string"),
  title: optional(string()),
  description: optional(string()),
  oneOf: array(TitledEnumOptionSchema),
  default: optional(string())
});
var UntitledMultiSelectEnumSchema = object({
  type: literal("array"),
  title: optional(string()),
  description: optional(string()),
  minItems: optional(number()),
  maxItems: optional(number()),
  items: object({
    type: literal("string"),
    enum: array(string())
  }),
  default: optional(array(string()))
});
var TitledMultiSelectEnumSchema = object({
  type: literal("array"),
  title: optional(string()),
  description: optional(string()),
  minItems: optional(number()),
  maxItems: optional(number()),
  items: object({
    anyOf: array(TitledEnumOptionSchema)
  }),
  default: optional(array(string()))
});
var LegacyTitledEnumSchema = object({
  type: literal("string"),
  title: optional(string()),
  description: optional(string()),
  enum: array(string()),
  enumNames: optional(array(string())),
  default: optional(string())
});
var EnumSchemaSchema = union([
  LegacyTitledEnumSchema,
  UntitledSingleSelectEnumSchema,
  TitledSingleSelectEnumSchema,
  UntitledMultiSelectEnumSchema,
  TitledMultiSelectEnumSchema
]);
var PrimitiveSchemaDefinitionSchema = union([
  BooleanSchemaSchema,
  NumberSchemaSchema,
  EnumSchemaSchema,
  StringSchemaSchema
]);
var ElicitRequestFormParamsSchema = object({
  ...BaseRequestParamsSchema.entries,
  mode: optional(literal("form")),
  /**
   * The message to present to the user.
   */
  message: string(),
  /**
   * The schema for the requested user input.
   */
  requestedSchema: object({
    $schema: optional(string()),
    type: literal("object"),
    properties: record(string(), PrimitiveSchemaDefinitionSchema),
    required: optional(array(string()))
  })
});
var ElicitRequestURLParamsSchema = object({
  ...BaseRequestParamsSchema.entries,
  mode: literal("url"),
  message: string(),
  url: pipe(string(), url())
});
var ElicitRequestSchema = object({
  ...RequestSchema.entries,
  method: literal("elicitation/create"),
  params: union([
    ElicitRequestFormParamsSchema,
    ElicitRequestURLParamsSchema
  ])
});
var ElicitResultSchema = object({
  ...ResultSchema.entries,
  /**
   * The user's response action.
   */
  action: picklist(["accept", "decline", "cancel"]),
  /**
   * The collected user input content (only present if action is "accept").
   */
  content: optional(record(string(), unknown()))
});
var ResourceTemplateReferenceSchema = object({
  type: literal("ref/resource"),
  /**
   * The URI or URI template of the resource.
   */
  uri: string()
});
var PromptReferenceSchema = object({
  type: literal("ref/prompt"),
  /**
   * The name of the prompt or prompt template
   */
  name: string()
});
var CompleteRequestSchema = object({
  ...RequestSchema.entries,
  method: literal("completion/complete"),
  params: object({
    ...BaseRequestParamsSchema.entries,
    ref: union([PromptReferenceSchema, ResourceTemplateReferenceSchema]),
    /**
     * The argument's information
     */
    argument: object({
      /**
       * The name of the argument
       */
      name: string(),
      /**
       * The value of the argument to use for completion matching.
       */
      value: string()
    }),
    context: optional(
      object({
        /**
         * Previously-resolved variables in a URI template or prompt.
         */
        arguments: optional(record(string(), string()))
      })
    )
  })
});
var CompleteResultSchema = looseObject({
  ...ResultSchema.entries,
  completion: object({
    /**
     * An array of completion values. Must not exceed 100 items.
     */
    values: pipe(array(string()), maxLength(100)),
    /**
     * The total number of completion options available. This can exceed the number of values actually sent in the response.
     */
    total: optional(pipe(number(), integer())),
    /**
     * Indicates whether there are additional completion options beyond those provided in the current response, even if the exact total is unknown.
     */
    hasMore: optional(boolean())
  })
});
var RootSchema = object({
  /**
   * The URI identifying the root. This *must* start with file:// for now.
   */
  uri: pipe(string(), startsWith("file://")),
  /**
   * An optional name for the root.
   */
  name: optional(string()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({}))
});
var ListRootsRequestSchema = object({
  ...RequestSchema.entries,
  method: literal("roots/list")
});
var ListRootsResultSchema = object({
  ...ResultSchema.entries,
  roots: array(RootSchema)
});
var RootsListChangedNotificationSchema = object({
  ...NotificationSchema.entries,
  method: literal("notifications/roots/list_changed")
});
var InputRequestSchema = union([
  ElicitRequestSchema,
  CreateMessageRequestSchema,
  ListRootsRequestSchema
]);
var InputRequestsSchema = record(string(), InputRequestSchema);
var InputResponsesSchema = custom(
  /** @type {(input: unknown)=>input is Record<string, unknown>} */
  ((input) => typeof input === "object" && input !== null && !Array.isArray(input) && (Object.getPrototypeOf(input) === Object.prototype || Object.getPrototypeOf(input) === null)),
  "Expected an input response map"
);
var InputRequiredResultSchema = pipe(
  looseObject({
    ...ResultSchema.entries,
    resultType: literal("input_required"),
    inputRequests: optional(InputRequestsSchema),
    requestState: optional(string())
  }),
  check(
    (result) => result.inputRequests !== void 0 || result.requestState !== void 0,
    "InputRequiredResult requires inputRequests or requestState"
  )
);
var ClientRequestSchema = union([
  PingRequestSchema,
  InitializeRequestSchema,
  CompleteRequestSchema,
  SetLevelRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  SubscriptionsListenRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
  CallToolRequestSchema,
  ListToolsRequestSchema
]);
var ClientNotificationSchema = union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  InitializedNotificationSchema,
  RootsListChangedNotificationSchema
]);
var ClientResultSchema = union([
  EmptyResultSchema,
  CreateMessageResultSchema,
  ElicitResultSchema,
  ListRootsResultSchema
]);
var ServerRequestSchema = union([
  PingRequestSchema,
  CreateMessageRequestSchema,
  ElicitRequestSchema,
  ListRootsRequestSchema
]);
var ServerNotificationSchema = union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  LoggingMessageNotificationSchema,
  SubscriptionsAcknowledgedNotificationSchema,
  ResourceUpdatedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  PromptListChangedNotificationSchema
]);
var ServerResultSchema = pipe(
  union([
    InputRequiredResultSchema,
    SubscriptionsListenResultSchema,
    EmptyResultSchema,
    InitializeResultSchema,
    CompleteResultSchema,
    GetPromptResultSchema,
    ListPromptsResultSchema,
    ListResourcesResultSchema,
    ListResourceTemplatesResultSchema,
    ReadResourceResultSchema,
    CallToolResultSchema,
    ListToolsResultSchema
  ]),
  check(
    (result) => (
      /** @type {Record<string, unknown>} */
      result.resultType !== "input_required" || safeParse(InputRequiredResultSchema, result).success
    ),
    "Invalid InputRequiredResult"
  )
);

// node_modules/.pnpm/tmcp@1.20.0/node_modules/tmcp/src/validation/method-policy.js
var method_policy = {
  // Requires an open client session.
  initialize: { session: true, stateless: false },
  "notifications/initialized": { session: true, stateless: false },
  "notifications/progress": { session: true, stateless: false },
  ping: { session: true, stateless: false },
  "logging/setLevel": { session: true, stateless: false },
  "resources/subscribe": { session: true, stateless: false },
  "resources/unsubscribe": { session: true, stateless: false },
  "notifications/roots/list_changed": { session: true, stateless: false },
  // Only available when version details are included in this request.
  "server/discover": { session: false, stateless: true },
  "subscriptions/listen": { session: false, stateless: true }
};
function is_method_allowed(method, stateless) {
  const policy = method_policy[method];
  if (!policy) return true;
  return stateless ? policy.stateless : policy.session;
}
var CACHEABLE_METHODS = /* @__PURE__ */ new Set([
  "server/discover",
  "tools/list",
  "prompts/list",
  "resources/list",
  "resources/read",
  "resources/templates/list"
]);
var MRTR_METHODS = /* @__PURE__ */ new Set([
  "tools/call",
  "prompts/get",
  "resources/read"
]);

// node_modules/.pnpm/tmcp@1.20.0/node_modules/tmcp/src/internal/utils.js
function event(type, detail) {
  return new CustomEvent(type, { detail });
}

// node_modules/.pnpm/tmcp@1.20.0/node_modules/tmcp/src/index.js
var MAX_ENCODED_REQUEST_STATE_LENGTH = 262144;
var RequestStateEnvelopeSchema = object({
  version: literal(1),
  inputResponses: InputResponsesSchema,
  state: optional(unknown())
});
var InputRequiredSignal = class extends Error {
  constructor() {
    super(
      "Input required: this request must end with an InputRequiredResult. If you see this message in a response, a catch block in a handler swallowed the internal input-required signal or the input call was not awaited \u2014 always await input calls and rethrow the signal (see isInputRequired())."
    );
    this.name = "InputRequiredSignal";
  }
};
function getPerRequestProtocolVersions() {
  return [...KNOWN_PER_REQUEST_PROTOCOL_VERSIONS];
}
var Sqids2;
async function get_sqids() {
  if (!Sqids2) {
    Sqids2 = new (await Promise.resolve().then(() => (init_sqids(), sqids_exports))).default();
  }
  return Sqids2;
}
async function encode_cursor(offset) {
  return (await get_sqids()).encode([offset]);
}
async function decode_cursor(cursor) {
  const [decoded] = (await get_sqids()).decode(cursor);
  return decoded;
}
async function safe_enabled(enabled) {
  try {
    return await enabled();
  } catch {
    return false;
  }
}
var McpServer = class {
  #server = new import_json_rpc_22.JSONRPCServer({
    errorListener: (...args) => {
      const mrtr = this.#ctx_storage.getStore()?.mrtr;
      if (mrtr !== void 0 && args[1] === mrtr.signal) return;
      console.warn(...args);
    }
  });
  /**
   * @type {JSONRPCClient<"broadcast" | "standalone"> | undefined}
   */
  #client;
  #options;
  /**
   * @type {Map<string, Tool<any, any>>}
   */
  #tools = /* @__PURE__ */ new Map();
  /**
   * @type {Map<string, Prompt<any>>}
   */
  #prompts = /* @__PURE__ */ new Map();
  /**
   * @type {Map<string, StoredResource>}
   */
  #resources = /* @__PURE__ */ new Map();
  #templates = new UriTemplateMatcher();
  /**
   * @type {Array<{uri: string, name?: string}>}
   */
  roots = [];
  /**
   * @type {{ [ref: string]: Map<string, Partial<Record<string, Completion>>> }}
   */
  #completions = {
    "ref/prompt": /* @__PURE__ */ new Map(),
    "ref/resource": /* @__PURE__ */ new Map()
  };
  #event_target = new EventTarget();
  /**
   * @type {ServerInfo}
   */
  #server_info;
  /**
   * @type {AsyncLocalStorage<ReceiveContext<CustomContext> & { progress_token?: string, request_id?: string | number, stateless?: boolean, mrtr?: MrtrState }>}
   */
  #ctx_storage = new AsyncLocalStorage();
  /**
   * @param {ServerInfo} server_info
   * @param {ServerOptions<StandardSchema>} options
   */
  constructor(server_info, options) {
    this.#options = options;
    this.#server_info = server_info;
    this.#server.mapErrorToJSONRPCErrorResponse = (id, error) => {
      const mrtr = this.#ctx_storage.getStore()?.mrtr;
      if (mrtr !== void 0 && error === mrtr.signal && mrtr.pending.size > 0) {
        mrtr.signal_at_boundary = true;
      }
      if (error instanceof import_json_rpc_22.JSONRPCErrorException) {
        return (0, import_json_rpc_22.createJSONRPCErrorResponse)(
          id,
          error.code,
          error.message,
          error.data
        );
      }
      return (0, import_json_rpc_22.createJSONRPCErrorResponse)(
        id,
        -32603,
        /** @type {Error | undefined} */
        error?.message ?? "An unexpected error occurred"
      );
    };
    this.#server.addMethod("initialize", (initialize_request) => {
      try {
        const validated_initialize = parse(
          InitializeRequestParamsSchema,
          initialize_request
        );
        if (should_version_negotiation_fail(
          validated_initialize.protocolVersion
        )) {
          const error = new McpError(
            -32602,
            "Invalid protocol version format"
          );
          throw error;
        }
        const negotiated_version = negotiate_protocol_version(
          validated_initialize.protocolVersion
        );
        this.#event_target.dispatchEvent(
          event("initialize", validated_initialize)
        );
        const { cache, ...legacy_options } = options;
        return {
          protocolVersion: negotiated_version,
          ...legacy_options,
          serverInfo: server_info
        };
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        if (
          /** @type {Error} */
          error.message?.includes(
            "Protocol version"
          )
        ) {
          const rpc_error2 = new McpError(
            -32602,
            `Protocol version validation failed: ${/** @type {Error} */
            error.message}. Server supports: ${get_supported_versions().join(", ")}`
          );
          throw rpc_error2;
        }
        const rpc_error = new McpError(
          -32603,
          `Initialization failed: ${/** @type {Error} */
          error.message}`
        );
        throw rpc_error;
      }
    });
    this.#server.addMethod("ping", () => {
      return {};
    });
    this.#server.addMethod("notifications/initialized", () => {
      return null;
    });
    this.#server.addMethod("server/discover", (discover_request) => {
      this.#event_target.dispatchEvent(
        event(
          "discover",
          /** @type {DiscoverRequestParams} */
          discover_request
        )
      );
      return {
        supportedVersions: this.#enabled_protocol_versions(),
        capabilities: this.#discover_capabilities(),
        ...this.#options.instructions != null ? { instructions: this.#options.instructions } : {}
      };
    });
    this.#init_tools();
    this.#init_prompts();
    this.#init_resources();
    this.#init_roots();
    this.#init_completion();
    this.#init_logging();
    this.#init_subscriptions();
  }
  /**
   * Utility method to specify the type of the custom context for this server instance without the need to specify the standard schema type.
   * @example
   * const server = new McpServer({ ... }, { ... }).withContext<{ name: string }>();
   * @template {Record<string, unknown>} TCustom
   * @returns {McpServer<StandardSchema, TCustom>}
   */
  withContext() {
    return (
      /** @type {McpServer<StandardSchema, TCustom>} */
      /** @type {unknown} */
      this
    );
  }
  get #progress_token() {
    return this.#ctx_storage.getStore()?.progress_token;
  }
  /**
   * The context of the current request, include the session ID, any auth information, and custom data.
   * @type {Context<CustomContext>}
   */
  get ctx() {
    const {
      progress_token,
      request_id,
      stateless,
      mrtr,
      subscriptionOrigin,
      subscriptionManager,
      ...rest
    } = this.#ctx_storage.getStore() ?? {};
    if (mrtr !== void 0) {
      rest.requestState = mrtr.incoming_state;
    }
    return rest;
  }
  get #client_capabilities() {
    return this.#ctx_storage.getStore()?.sessionInfo?.clientCapabilities;
  }
  /**
   * Get the client information (name, version, etc.) of the client that initiated the current request...useful if you want to do something different based on the client.
   * @deprecated Use `server.ctx.sessionInfo.clientInfo` instead.
   */
  currentClientInfo() {
    return this.#ctx_storage.getStore()?.sessionInfo?.clientInfo;
  }
  /**
   * Get the client capabilities of the client that initiated the current request, you can use this to verify the client support something before invoking the respective method.
   * @deprecated Use `server.ctx.sessionInfo.clientCapabilities` instead.
   */
  currentClientCapabilities() {
    return this.#client_capabilities;
  }
  #lazyily_create_client() {
    if (!this.#client) {
      this.#client = new import_json_rpc_22.JSONRPCClient((payload, kind) => {
        if (kind === "broadcast") {
          this.#event_target.dispatchEvent(
            event("broadcast", { request: payload })
          );
          return;
        }
        this.#event_target.dispatchEvent(
          event("send", { request: payload })
        );
      });
    }
  }
  /**
   * @template {keyof McpEvents} TEvent
   * @param {TEvent} event
   * @param {McpEvents[TEvent]} callback
   * @param {AddEventListenerOptions} [options]
   */
  on(event2, callback, options) {
    if (event2 === "send" || event2 === "broadcast") {
      this.#lazyily_create_client();
    }
    const listener = (e) => {
      callback(
        /** @type {CustomEvent} */
        e.detail
      );
    };
    this.#event_target.addEventListener(event2, listener, options);
    return () => {
      this.#event_target.removeEventListener(event2, listener, options);
    };
  }
  /**
   * @param {string} method
   * @param {JSONRPCParams} [params]
   * @param {"broadcast" | "standalone"} [kind]
   */
  #notify(method, params, kind = "standalone") {
    this.#client?.notify(method, params, kind);
  }
  /**
   *
   */
  #init_tools() {
    if (!this.#options.capabilities?.tools) return;
    this.#server.addMethod("tools/list", async ({ cursor } = {}) => {
      const all_tools = (await Promise.all(
        [...this.#tools].map(async ([name2, tool]) => {
          if (tool.enabled != null && await safe_enabled(tool.enabled) === false)
            return null;
          return {
            name: name2,
            title: tool.title || tool.description,
            description: tool.description,
            icons: tool.icons,
            _meta: tool._meta,
            inputSchema: tool.schema && this.#options.adapter ? await this.#options.adapter.toJsonSchema(
              tool.schema
            ) : { type: "object", properties: {} },
            ...tool.outputSchema && this.#options.adapter ? {
              outputSchema: await this.#options.adapter.toJsonSchema(
                tool.outputSchema
              )
            } : {},
            ...tool.annotations ? {
              annotations: tool.annotations
            } : {}
          };
        })
      )).filter((tool) => tool !== null);
      const pagination_options = this.#options.pagination?.tools;
      if (!pagination_options || pagination_options.size == null) {
        return { tools: all_tools };
      }
      const page_length = pagination_options.size;
      const offset = cursor ? await decode_cursor(cursor) : 0;
      const start_index = offset;
      const end_index = start_index + page_length;
      const tools = all_tools.slice(start_index, end_index);
      const has_next = end_index < all_tools.length;
      const next_cursor = has_next ? await encode_cursor(end_index) : null;
      return {
        tools,
        ...next_cursor && { nextCursor: next_cursor }
      };
    });
    this.#server.addMethod(
      "tools/call",
      async ({ name: name2, arguments: args }) => {
        const tool = this.#tools.get(name2);
        if (!tool) {
          return (
            /** @type {CallToolResult<any>} */
            {
              isError: true,
              content: [
                {
                  type: "text",
                  text: `Tool ${name2} not found`
                }
              ]
            }
          );
        }
        let validated_args = args;
        this.#mark_mrtr_registration("tool", name2, tool.replayable);
        if (tool.schema) {
          let validation_result = tool.schema["~standard"].validate(args);
          if (validation_result instanceof Promise)
            validation_result = await validation_result;
          if (validation_result.issues) {
            return (
              /** @type {CallToolResult<any>} */
              {
                isError: true,
                content: [
                  {
                    type: "text",
                    text: `Invalid arguments for tool ${name2}: ${JSON.stringify(validation_result.issues)}`
                  }
                ]
              }
            );
          }
          validated_args = validation_result.value;
        }
        const tool_result = tool.schema ? await tool.execute(validated_args) : await tool.execute();
        const parsed_result = parse(
          CallToolResultSchema,
          tool_result
        );
        if (tool.outputSchema && parsed_result.structuredContent !== void 0) {
          let output_validation = tool.outputSchema["~standard"].validate(parsed_result.structuredContent);
          if (output_validation instanceof Promise)
            output_validation = await output_validation;
          if (output_validation.issues) {
            return (
              /** @type {CallToolResult<any>} */
              {
                isError: true,
                content: [
                  {
                    type: "text",
                    text: `Tool ${name2} returned invalid structured content: ${JSON.stringify(output_validation.issues)}`
                  }
                ]
              }
            );
          }
          parsed_result.structuredContent = output_validation.value;
        }
        return parsed_result;
      }
    );
  }
  /**
   *
   */
  #init_prompts() {
    if (!this.#options.capabilities?.prompts) return;
    this.#server.addMethod("prompts/list", async ({ cursor } = {}) => {
      const all_prompts = (await Promise.all(
        [...this.#prompts].map(async ([name2, prompt]) => {
          if (prompt.enabled != null && await safe_enabled(prompt.enabled) === false)
            return null;
          const arguments_schema = prompt.schema && this.#options.adapter ? await this.#options.adapter.toJsonSchema(
            prompt.schema
          ) : {
            type: "object",
            properties: (
              /** @type {Record<string, {description: string}>} */
              {}
            ),
            required: []
          };
          const keys = Object.keys(
            arguments_schema.properties ?? {}
          );
          const required = arguments_schema.required ?? [];
          return {
            name: name2,
            title: prompt.title || prompt.description,
            icons: prompt.icons,
            description: prompt.description,
            arguments: keys.map((key) => {
              const property = arguments_schema.properties?.[key];
              const description2 = property && property !== true ? property.description : key;
              return {
                name: key,
                required: required.includes(key),
                description: description2
              };
            })
          };
        })
      )).filter((prompt) => prompt !== null);
      const pagination_options = this.#options.pagination?.prompts;
      if (!pagination_options || pagination_options.size == null) {
        return { prompts: all_prompts };
      }
      const page_length = pagination_options.size;
      const offset = cursor ? await decode_cursor(cursor) : 0;
      const start_index = offset;
      const end_index = start_index + page_length;
      const prompts = all_prompts.slice(start_index, end_index);
      const has_next = end_index < all_prompts.length;
      const next_cursor = has_next ? await encode_cursor(end_index) : null;
      return {
        prompts,
        ...next_cursor && { nextCursor: next_cursor }
      };
    });
    this.#server.addMethod(
      "prompts/get",
      async ({ name: name2, arguments: args }) => {
        const prompt = this.#prompts.get(name2);
        if (!prompt) {
          throw new McpError(-32602, `Prompt ${name2} not found`);
        }
        this.#mark_mrtr_registration("prompt", name2, prompt.replayable);
        if (!prompt.schema) {
          return parse(
            GetPromptResultSchema,
            await prompt.execute()
          );
        }
        let validated_args = prompt.schema["~standard"].validate(args);
        if (validated_args instanceof Promise)
          validated_args = await validated_args;
        if (validated_args.issues) {
          throw new McpError(
            -32602,
            `Invalid arguments for prompt ${name2}: ${JSON.stringify(validated_args.issues)}`
          );
        }
        return parse(
          GetPromptResultSchema,
          await prompt.execute(validated_args.value)
        );
      }
    );
  }
  /**
   *
   */
  #init_resources() {
    if (!this.#options.capabilities?.resources) return;
    if (this.#options.capabilities?.resources?.subscribe) {
      this.#server.addMethod("resources/subscribe", async ({ uri }) => {
        this.#event_target.dispatchEvent(
          event("subscription", { uri, action: "add" })
        );
        return {};
      });
      this.#server.addMethod("resources/unsubscribe", async ({ uri }) => {
        this.#event_target.dispatchEvent(
          event("subscription", { uri, action: "remove" })
        );
        return {};
      });
    }
    this.#server.addMethod("resources/list", async ({ cursor } = {}) => {
      const all_resources = [];
      for (const [uri, resource] of this.#resources) {
        if (!resource.template) {
          if (resource.enabled != null && await safe_enabled(resource.enabled) === false)
            continue;
          all_resources.push({
            name: resource.name,
            title: resource.title || resource.description,
            description: resource.description,
            uri,
            mimeType: resource.mimeType,
            icons: resource.icons
          });
        } else if (resource.list_resources) {
          if (resource.enabled != null && await safe_enabled(resource.enabled) === false)
            continue;
          const template_resources = await resource.list_resources();
          all_resources.push(...template_resources);
        }
      }
      const pagination_options = this.#options.pagination?.resources;
      if (!pagination_options || pagination_options.size == null) {
        return { resources: all_resources };
      }
      const page_length = pagination_options.size;
      const offset = cursor ? await decode_cursor(cursor) : 0;
      const start_index = offset;
      const end_index = start_index + page_length;
      const resources = all_resources.slice(start_index, end_index);
      const has_next = end_index < all_resources.length;
      const next_cursor = has_next ? await encode_cursor(end_index) : null;
      return {
        resources,
        ...next_cursor && { nextCursor: next_cursor }
      };
    });
    this.#server.addMethod("resources/templates/list", async () => {
      return {
        resourceTemplates: (await Promise.all(
          [...this.#resources].map(async ([uri, resource]) => {
            if (!resource.template) return null;
            if (resource.enabled != null && await safe_enabled(resource.enabled) === false)
              return null;
            return {
              name: resource.name,
              icons: resource.icons,
              title: resource.title || resource.description,
              description: resource.description,
              mimeType: resource.mimeType,
              uriTemplate: uri
            };
          })
        )).filter((resource) => resource != null)
      };
    });
    this.#server.addMethod("resources/read", async ({ uri }) => {
      let resource = this.#resources.get(uri);
      let params;
      if (!resource) {
        const match = this.#templates.match(uri);
        if (match) {
          resource = this.#resources.get(match.template);
          params = match.params;
        }
        if (!resource) {
          throw new McpError(-32602, `Resource ${uri} not found`);
        }
      }
      this.#mark_mrtr_registration(
        resource.template ? "template" : "resource",
        resource.name,
        resource.replayable
      );
      if (resource.template) {
        if (!params)
          throw new McpError(
            -32602,
            "Missing parameters for template resource"
          );
        return parse(
          ReadResourceResultSchema,
          await resource.execute(uri, params)
        );
      }
      return parse(
        ReadResourceResultSchema,
        await resource.execute(uri)
      );
    });
  }
  /**
   *
   */
  #init_roots() {
    this.#server.addMethod("notifications/roots/list_changed", () => {
      this.#refresh_roots();
      return null;
    });
  }
  /**
   * Request roots list from client
   */
  async #refresh_roots() {
    if (this.#is_stateless) {
      throw new McpError(
        -32603,
        "Client roots are not available during per-request (stateless) execution: roots are deprecated in protocol version 2026-07-28 and tmcp does not emit roots/list as a multi round-trip input request"
      );
    }
    if (!this.#client_capabilities?.roots) return;
    this.#lazyily_create_client();
    try {
      const response = await this.#client?.request(
        "roots/list",
        void 0,
        "standalone"
      );
      this.roots = response?.roots || [];
    } catch {
      this.roots = [];
    }
  }
  #init_completion() {
    this.#server.addMethod(
      "completion/complete",
      async ({ argument, ref, context }) => {
        const completions = this.#completions[ref.type];
        if (!completions) return null;
        const complete = completions.get(ref.uri ?? ref.name);
        if (!complete) return null;
        const actual_complete = complete[argument.name];
        if (!actual_complete) return null;
        return parse(
          CompleteResultSchema,
          await actual_complete(argument.value, context)
        );
      }
    );
  }
  #init_logging() {
    if (!this.#options.capabilities?.logging) return;
    this.#server.addMethod("logging/setLevel", ({ level }) => {
      this.#event_target.dispatchEvent(
        event("loglevelchange", { level })
      );
      return {};
    });
  }
  /**
   * Reduce a requested filter to notification types enabled by this server.
   * @param {SubscriptionFilter} requested
   * @returns {SubscriptionFilter}
   */
  #subscription_filters(requested) {
    const capabilities = this.#options.capabilities;
    const filters = {};
    if (requested.toolsListChanged === true && capabilities?.tools?.listChanged === true) {
      filters.toolsListChanged = true;
    }
    if (requested.promptsListChanged === true && capabilities?.prompts?.listChanged === true) {
      filters.promptsListChanged = true;
    }
    if (requested.resourcesListChanged === true && capabilities?.resources?.listChanged === true) {
      filters.resourcesListChanged = true;
    }
    if (requested.resourceSubscriptions?.length && capabilities?.resources?.subscribe === true) {
      const resources = [
        ...new Set(requested.resourceSubscriptions)
      ].filter(
        (uri) => this.#subscription_resource_registration(uri) !== void 0
      );
      if (resources.length > 0) filters.resourceSubscriptions = resources;
    }
    return filters;
  }
  /**
   * Resolve a static resource or a concrete URI handled by a template. The
   * template pattern itself is not a subscribable resource URI.
   * @param {string} uri
   */
  #subscription_resource_registration(uri) {
    const resource = this.#resources.get(uri);
    if (resource) return resource.template ? void 0 : resource;
    const match = this.#templates.match(uri);
    return match ? this.#resources.get(match.template) : void 0;
  }
  /**
   * Register the long-lived per-request subscription method and cancellation
   * notification. Transports keep the response sink open while the returned
   * promise is pending.
   */
  #init_subscriptions() {
    this.#server.addMethod("subscriptions/listen", async (params) => {
      const parsed = safeParse(
        SubscriptionsListenRequestParamsSchema,
        params
      );
      if (!parsed.success) {
        throw new McpError(
          -32602,
          "Invalid subscriptions/listen params: expected a notifications filter"
        );
      }
      const id = this.#ctx_storage.getStore()?.request_id;
      if (id === void 0) {
        throw new McpError(
          -32600,
          "subscriptions/listen must be a JSON-RPC request with an id"
        );
      }
      const store2 = this.#ctx_storage.getStore();
      const origin = store2?.subscriptionOrigin;
      const manager = store2?.subscriptionManager;
      if (typeof origin !== "string" || manager === void 0) {
        throw new McpError(
          -32603,
          "subscriptions/listen requires the transport to provide a subscriptionManager and stable string subscriptionOrigin for this connection"
        );
      }
      const filters = this.#subscription_filters(
        parsed.output.notifications
      );
      let settle = () => {
      };
      const pending = new Promise((resolve) => {
        settle = resolve;
      });
      const created = await manager.create(
        { id, origin, filters },
        {
          acknowledge: () => this.#subscription_send(id, origin, {
            jsonrpc: "2.0",
            method: "notifications/subscriptions/acknowledged",
            params: {
              notifications: filters,
              _meta: {
                [SUBSCRIPTION_ID_META_KEY]: id
              }
            }
          }),
          send: (notification) => this.#subscription_send(
            id,
            origin,
            this.#tag_subscription(notification, id)
          ),
          close: () => {
            settle({
              _meta: { [SUBSCRIPTION_ID_META_KEY]: id }
            });
          }
        }
      );
      if (!created) {
        throw new McpError(
          -32602,
          `A subscription with id ${JSON.stringify(id)} is already active for this connection`
        );
      }
      return pending;
    });
    this.#server.addMethod("notifications/cancelled", async (params) => {
      const cancellation = safeParse(
        CancelledNotificationSchema.entries.params,
        params
      );
      const store2 = this.#ctx_storage.getStore();
      const origin = store2?.subscriptionOrigin;
      const manager = store2?.subscriptionManager;
      if (cancellation.success && origin !== void 0 && manager !== void 0) {
        await manager.close(
          cancellation.output.requestId,
          origin,
          "cancelled"
        );
      }
      return null;
    });
  }
  /**
   * @param {JSONRPCRequest} notification
   * @param {string | number} subscription_id
   */
  #tag_subscription(notification, subscription_id) {
    const params = (
      /** @type {Record<string, unknown>} */
      notification.params ?? {}
    );
    return {
      ...notification,
      params: {
        ...params,
        _meta: {
          .../** @type {Record<string, unknown> | undefined} */
          params._meta,
          [SUBSCRIPTION_ID_META_KEY]: subscription_id
        }
      }
    };
  }
  /**
   * @param {string | number} subscription_id
   * @param {string} origin
   * @param {JSONRPCRequest} request
   */
  #subscription_send(subscription_id, origin, request2) {
    this.#event_target.dispatchEvent(
      event("send", {
        subscriptionId: subscription_id,
        subscriptionOrigin: origin,
        request: request2
      })
    );
  }
  #notify_tools_list_changed() {
    if (this.#options.capabilities?.tools?.listChanged) {
      this.#broadcast_change("notifications/tools/list_changed", {});
    }
  }
  #notify_prompts_list_changed() {
    if (this.#options.capabilities?.prompts?.listChanged) {
      this.#broadcast_change("notifications/prompts/list_changed", {});
    }
  }
  #notify_resources_list_changed() {
    if (this.#options.capabilities?.resources?.listChanged) {
      this.#broadcast_change("notifications/resources/list_changed", {});
    }
  }
  /**
   * Publish a change through the existing broadcast lifecycle. Transports use
   * `subscriptionOnly` to keep concrete template updates off legacy streams.
   * @param {string} method
   * @param {Record<string, unknown>} params
   * @param {boolean} [subscription_only]
   */
  #broadcast_change(method, params, subscription_only = false) {
    this.#event_target.dispatchEvent(
      event("broadcast", {
        request: { jsonrpc: "2.0", method, params },
        ...subscription_only ? { subscriptionOnly: true } : {}
      })
    );
  }
  /**
   * Use the `defineTool` utility to create a reusable tool and pass it to this method to add it to the server.
   * @template {Array<CreatedTool<any, any>>} T
   * @template {T extends Array<CreatedTool<infer TSchema, infer TOutputSchema>> ? AllSame<TSchema, StandardSchema | undefined> extends true ? AllSame<TOutputSchema, StandardSchema | undefined> extends true ? T : never : never : never} U
   * @param {T & NoInfer<U>} tools
   */
  tools(tools) {
    for (const tool of tools) {
      this.tool(tool);
    }
  }
  /**
   * Use the `definePrompt` utility to create a reusable tool and pass it to this method to add it to the server.
   * @template {Array<CreatedPrompt<any>>} T
   * @template {T extends Array<CreatedPrompt<infer TSchema>> ? AllSame<TSchema, StandardSchema | undefined> extends true ?  T : never : never} U
   * @param {T & NoInfer<U>} prompts
   */
  prompts(prompts) {
    for (const prompt of prompts) {
      this.prompt(prompt);
    }
  }
  /**
   * Use the `defineResource` utility to create a reusable resource and pass it to this method to add it to the server.
   *
   * @param {CreatedResource[]} resources
   */
  resources(resources) {
    for (const resource of resources) {
      this.resource(resource);
    }
  }
  /**
   * Use the `defineTemplate` utility to create a reusable template and pass it to this method to add it to the server.
   *
   * @param {CreatedTemplate<any>[]} templates
   */
  templates(templates) {
    for (const template of templates) {
      this.template(template);
    }
  }
  /**
   * Add a tool to the server. If you want to receive any input you need to provide a schema. The schema needs to be a valid Standard Schema V1 schema and needs to be an Object with the properties you need,
   * Use the description and title to help the LLM to understand what the tool does and when to use it. If you provide an outputSchema, you need to return a structuredContent that matches the schema.
   *
   * Tools will be invoked by the LLM when it thinks it needs to use them, you can use the annotations to provide additional information about the tool, like what it does, how to use it, etc.
   * @template {StandardSchema | undefined} [TSchema=undefined]
   * @template {StandardSchema | undefined} [TOutputSchema=undefined]
   * @overload
   * @param {CreatedTool<TSchema, TOutputSchema>} tool_or_options
   * @returns {void}
   */
  /**
   * Add a tool to the server. If you want to receive any input you need to provide a schema. The schema needs to be a valid Standard Schema V1 schema and needs to be an Object with the properties you need,
   * Use the description and title to help the LLM to understand what the tool does and when to use it. If you provide an outputSchema, you need to return a structuredContent that matches the schema.
   *
   * Tools will be invoked by the LLM when it thinks it needs to use them, you can use the annotations to provide additional information about the tool, like what it does, how to use it, etc.
   * @template {StandardSchema | undefined} [TSchema=undefined]
   * @template {StandardSchema | undefined} [TOutputSchema=undefined]
   * @overload
   * @param {ToolOptions<TSchema, TOutputSchema>} tool_or_options
   * @param {TSchema extends undefined ? (()=>Promise<CallToolResult<TOutputSchema extends undefined ? undefined : StandardSchemaV1.InferInput<TOutputSchema extends undefined ? never : TOutputSchema>>> | CallToolResult<TOutputSchema extends undefined ? undefined : StandardSchemaV1.InferInput<TOutputSchema extends undefined ? never : TOutputSchema>>) : ((input: StandardSchemaV1.InferInput<TSchema extends undefined ? never : TSchema>) => Promise<CallToolResult<TOutputSchema extends undefined ? undefined : StandardSchemaV1.InferInput<TOutputSchema extends undefined ? never : TOutputSchema>>> | CallToolResult<TOutputSchema extends undefined ? undefined : StandardSchemaV1.InferInput<TOutputSchema extends undefined ? never : TOutputSchema>>)} execute
   * @returns {void}
   * */
  /**
   * Add a tool to the server. If you want to receive any input you need to provide a schema. The schema needs to be a valid Standard Schema V1 schema and needs to be an Object with the properties you need,
   * Use the description and title to help the LLM to understand what the tool does and when to use it. If you provide an outputSchema, you need to return a structuredContent that matches the schema.
   *
   * Tools will be invoked by the LLM when it thinks it needs to use them, you can use the annotations to provide additional information about the tool, like what it does, how to use it, etc.
   * @template {StandardSchema | undefined} [TSchema=undefined]
   * @template {StandardSchema | undefined} [TOutputSchema=undefined]
   * @param {CreatedTool<TSchema, TOutputSchema> | ToolOptions<TSchema, TOutputSchema>} tool_or_options
   * @param {undefined | TSchema extends undefined ? (()=>Promise<CallToolResult<TOutputSchema extends undefined ? undefined : StandardSchemaV1.InferInput<TOutputSchema extends undefined ? never : TOutputSchema>>> | CallToolResult<TOutputSchema extends undefined ? undefined : StandardSchemaV1.InferInput<TOutputSchema extends undefined ? never : TOutputSchema>>) : ((input: StandardSchemaV1.InferInput<TSchema extends undefined ? never : TSchema>) => Promise<CallToolResult<TOutputSchema extends undefined ? undefined : StandardSchemaV1.InferInput<TOutputSchema extends undefined ? never : TOutputSchema>>> | CallToolResult<TOutputSchema extends undefined ? undefined : StandardSchemaV1.InferInput<TOutputSchema extends undefined ? never : TOutputSchema>>)} [execute]
   */
  tool(tool_or_options, execute) {
    if ("execute" in tool_or_options) {
      execute = tool_or_options.execute;
    }
    this.#notify_tools_list_changed();
    const stored_tool = (
      /** @type {Tool<any, any>} */
      tool_or_options
    );
    stored_tool.execute = /** @type {NonNullable<typeof execute>} */
    execute;
    this.#tools.set(tool_or_options.name, stored_tool);
  }
  /**
   * Run transport-specific validation against a registered tool's JSON
   * Schema without enabling, validating, or executing the tool.
   * @param {string} name
   * @param {Record<string, unknown>} args
   * @param {(input_schema: Record<string, unknown>, args: Record<string, unknown>)=>void | Promise<void>} validator
   * @returns {Promise<boolean>}
   */
  async validateToolCall(name2, args, validator) {
    const tool = this.#tools.get(name2);
    if (!tool) return false;
    const input_schema = tool.schema && this.#options.adapter ? await this.#options.adapter.toJsonSchema(tool.schema) : { type: "object", properties: {} };
    await validator(
      /** @type {Record<string, unknown>} */
      input_schema,
      args
    );
    return true;
  }
  /**
   * Add a prompt to the server. Prompts are used to provide the user with pre-defined messages that adds context to the LLM.
   * Use the description and title to help the user to understand what the prompt does and when to use it.
   *
   * A prompt can also have a schema that defines the input it expects, the user will be prompted to enter the inputs you request. It can also have a complete function
   * for each input that will be used to provide completions for the user.
   * @template {StandardSchema | undefined} [TSchema=undefined]
   * @overload
   * @param {CreatedPrompt<TSchema>} prompt_or_options
   * @returns {void}
   */
  /**
   * Add a prompt to the server. Prompts are used to provide the user with pre-defined messages that adds context to the LLM.
   * Use the description and title to help the user to understand what the prompt does and when to use it.
   *
   * A prompt can also have a schema that defines the input it expects, the user will be prompted to enter the inputs you request. It can also have a complete function
   * for each input that will be used to provide completions for the user.
   * @template {StandardSchema | undefined} [TSchema=undefined]
   * @overload
   * @param {PromptOptions<TSchema>} prompt_or_options
   * @param {TSchema extends undefined ? (()=>Promise<GetPromptResult> | GetPromptResult) : (input: StandardSchemaV1.InferInput<TSchema extends undefined ? never : TSchema>) => Promise<GetPromptResult> | GetPromptResult} execute
   * @returns {void}
   * */
  /**
   * Add a prompt to the server. Prompts are used to provide the user with pre-defined messages that adds context to the LLM.
   * Use the description and title to help the user to understand what the prompt does and when to use it.
   *
   * A prompt can also have a schema that defines the input it expects, the user will be prompted to enter the inputs you request. It can also have a complete function
   * for each input that will be used to provide completions for the user.
   * @template {StandardSchema | undefined} [TSchema=undefined]
   * @param {CreatedPrompt<TSchema> | PromptOptions<TSchema>} prompt_or_options
   * @param {TSchema extends undefined ? (()=>Promise<GetPromptResult> | GetPromptResult) : (input: StandardSchemaV1.InferInput<TSchema extends undefined ? never : TSchema>) => Promise<GetPromptResult> | GetPromptResult} [execute]
   */
  prompt(prompt_or_options, execute) {
    if ("execute" in prompt_or_options) {
      execute = /** @type {NonNullable<typeof execute>} */
      prompt_or_options.execute;
    }
    if (prompt_or_options.complete) {
      this.#completions["ref/prompt"].set(
        prompt_or_options.name,
        prompt_or_options.complete
      );
    }
    this.#notify_prompts_list_changed();
    const stored_prompt = (
      /** @type {Prompt<any>} */
      prompt_or_options
    );
    stored_prompt.execute = /** @type {NonNullable<typeof execute>} */
    execute;
    this.#prompts.set(prompt_or_options.name, stored_prompt);
  }
  /**
   * @type {(resource: StoredResource & { uri: string })=> void}
   */
  #resource(resource) {
    if (resource.template && resource.complete) {
      this.#completions["ref/resource"].set(
        resource.uri,
        resource.complete
      );
    }
    if (resource.template) {
      this.#templates.add(resource.uri);
    }
    this.#notify_resources_list_changed();
    this.#resources.set(resource.uri, resource);
  }
  /**
   * Add a resource to the server. Resources are added manually to the context by the user to provide the LLM with additional context.
   * Use the description and title to help the user to understand what the resource is.
   * @overload
   * @param {CreatedResource} resource_or_options
   * @returns {void}
   */
  /**
   * Add a resource to the server. Resources are added manually to the context by the user to provide the LLM with additional context.
   * Use the description and title to help the user to understand what the resource is.
   * @overload
   * @param {ResourceOptions} resource_or_options
   * @param {(uri: string) => Promise<ReadResourceResult> | ReadResourceResult} execute
   * @returns {void}
   */
  /**
   * Add a resource to the server. Resources are added manually to the context by the user to provide the LLM with additional context.
   * Use the description and title to help the user to understand what the resource is.
   * @param {CreatedResource | ResourceOptions} resource_or_options
   * @param {(uri: string) => Promise<ReadResourceResult> | ReadResourceResult} [execute]
   */
  resource(resource_or_options, execute) {
    if ("execute" in resource_or_options) {
      execute = resource_or_options.execute;
    }
    const stored_resource = (
      /** @type {StoredResource & { uri: string }} */
      resource_or_options
    );
    stored_resource.execute = /** @type {NonNullable<typeof execute>} */
    execute;
    stored_resource.template = false;
    this.#resource(stored_resource);
  }
  /**
   * Add a resource template to the server. Resources are added manually to the context by the user to provide the LLM with additional context.
   * Resource templates are used to create resources dynamically based on a URI template. The URI template should be a valid URI template as defined in RFC 6570.
   * Resource templates can have a list method that returns a list of resources that match the template and a complete method that returns a list of resources given one of the template variables, this method will
   * be invoked to provide completions for the template variables to the user.
   * Use the description and title to help the user to understand what the resource is.
   * @template {string} TUri
   * @template {ExtractURITemplateVariables<TUri>} TVariables
   * @overload
   * @param {CreatedTemplate<TUri>} template_or_options
   * @returns {void}
   */
  /**
   * Add a resource template to the server. Resources are added manually to the context by the user to provide the LLM with additional context.
   * Resource templates are used to create resources dynamically based on a URI template. The URI template should be a valid URI template as defined in RFC 6570.
   * Resource templates can have a list method that returns a list of resources that match the template and a complete method that returns a list of resources given one of the template variables, this method will
   * be invoked to provide completions for the template variables to the user.
   * Use the description and title to help the user to understand what the resource is.
   * @template {string} TUri
   * @template {ExtractURITemplateVariables<TUri>} TVariables
   * @overload
   * @param {TemplateOptions<TUri>} template_or_options
   * @param {(uri: string, params: Record<TVariables, string | string[]>) => Promise<ReadResourceResult> | ReadResourceResult} execute
   * @returns {void}
   */
  /**
   * Add a resource template to the server. Resources are added manually to the context by the user to provide the LLM with additional context.
   * Resource templates are used to create resources dynamically based on a URI template. The URI template should be a valid URI template as defined in RFC 6570.
   * Resource templates can have a list method that returns a list of resources that match the template and a complete method that returns a list of resources given one of the template variables, this method will
   * be invoked to provide completions for the template variables to the user.
   * Use the description and title to help the user to understand what the resource is.
   * @template {string} TUri
   * @template {ExtractURITemplateVariables<TUri>} TVariables
   * @param {CreatedTemplate<TUri> | TemplateOptions<TUri>} template_or_options
   * @param {(uri: string, params: Record<TVariables, string | string[]>) => Promise<ReadResourceResult> | ReadResourceResult} [execute]
   */
  template(template_or_options, execute) {
    if ("execute" in template_or_options) {
      execute = template_or_options.execute;
    }
    const stored_template = (
      /** @type {StoredResource & { uri: string }} */
      /** @type {unknown} */
      template_or_options
    );
    stored_template.execute = /** @type {NonNullable<typeof execute>} */
    execute;
    stored_template.list_resources = template_or_options.list;
    stored_template.template = true;
    this.#resource(stored_template);
  }
  /**
   * The per-request protocol versions supported by tmcp.
   * @returns {string[]}
   */
  #enabled_protocol_versions() {
    return getPerRequestProtocolVersions();
  }
  /**
   * Check whether a JSON-RPC method is registered without invoking it.
   * @param {string} method
   */
  hasMethod(method) {
    return this.#server.hasMethod(method);
  }
  /**
   * Derive capabilities advertised through `server/discover`. Subscription
   * flags stay hidden until the active transport can route long-lived listen
   * streams; core support alone cannot guarantee delivery.
   * @returns {Record<string, unknown>}
   */
  #discover_capabilities() {
    const store2 = this.#ctx_storage.getStore();
    if (store2?.subscriptionManager !== void 0 && typeof store2.subscriptionOrigin === "string") {
      return { ...this.#options.capabilities ?? {} };
    }
    const { resources, tools, prompts, ...rest } = this.#options.capabilities ?? {};
    const capabilities = { ...rest };
    if (resources) {
      const { subscribe, listChanged, ...resources_rest } = resources;
      capabilities.resources = resources_rest;
    }
    if (tools) {
      const { listChanged, ...tools_rest } = tools;
      capabilities.tools = tools_rest;
    }
    if (prompts) {
      const { listChanged, ...prompts_rest } = prompts;
      capabilities.prompts = prompts_rest;
    }
    return capabilities;
  }
  /**
   * Resolve the effective cache policy for a cacheable method.
   * @param {string} method
   * @returns {{ ttlMs: number, cacheScope: 'public' | 'private' }}
   */
  #cache_policy(method) {
    const cache = this.#options.cache;
    const override = cache?.methods?.[method];
    return {
      ttlMs: override?.ttlMs ?? cache?.ttlMs ?? 0,
      cacheScope: override?.cacheScope ?? cache?.cacheScope ?? "private"
    };
  }
  /**
   * Decorate a successful per-request (stateless) wire result:
   * `resultType` (preserving handler-provided string extension values,
   * anything else becomes `'complete'`), serverInfo `_meta` merge, and
   * `ttlMs`/`cacheScope` for cacheable methods. The cache fields are
   * ALWAYS taken from the configured policy, overwriting any
   * handler-provided values: handlers are profile-unaware and must not be
   * able to opt results into public caching.
   * @param {string} method
   * @param {Record<string, unknown>} result
   * @param {boolean} [private_result]
   */
  #decorate_result(method, result, private_result = false) {
    if (typeof result.resultType !== "string") {
      result.resultType = "complete";
    }
    result._meta = {
      .../** @type {Record<string, unknown> | undefined} */
      result._meta,
      "io.modelcontextprotocol/serverInfo": this.#server_info
    };
    if (CACHEABLE_METHODS.has(method)) {
      const policy = private_result ? { ttlMs: 0, cacheScope: (
        /** @type {const} */
        "private"
      ) } : this.#cache_policy(method);
      result.ttlMs = policy.ttlMs;
      result.cacheScope = policy.cacheScope;
    }
  }
  /**
   * Build a JSON-RPC error response for a request, or `null` for a
   * notification (which cannot receive a response).
   * @param {string | number | undefined} id
   * @param {McpError} error
   */
  #error_response(id, error) {
    if (id === void 0) return Promise.resolve(null);
    return Promise.resolve({
      jsonrpc: (
        /** @type {const} */
        "2.0"
      ),
      id,
      error: {
        code: error.code,
        message: error.message,
        ...error.data !== void 0 ? { data: error.data } : {}
      }
    });
  }
  /**
   * The main function that receive a JSONRpc message and either dispatch a `send` event or process the request.
   *
   * @param {JSONRPCMessage} message
   * @param {ReceiveContext<CustomContext>} [ctx]
   * @returns {ReturnType<JSONRPCServer['receive']> | ReturnType<JSONRPCClient['receive'] | undefined>}
   */
  receive(message, ctx) {
    const validated_message = safeParse(
      union([JSONRPCRequestSchema, JSONRPCNotificationSchema]),
      message
    );
    if (validated_message.success) {
      const request_message = validated_message.output;
      const id = "id" in request_message ? request_message.id : void 0;
      const meta = request_message.params?._meta;
      const progress_token = (
        /** @type {string | undefined} */
        meta?.progressToken
      );
      const requested_version = meta?.["io.modelcontextprotocol/protocolVersion"];
      const request_capabilities = meta?.["io.modelcontextprotocol/clientCapabilities"];
      const request_client_info = meta?.["io.modelcontextprotocol/clientInfo"];
      const request_log_level = meta?.["io.modelcontextprotocol/logLevel"];
      const {
        // eslint-disable-next-line no-unused-vars
        protocolVersion,
        // eslint-disable-next-line no-unused-vars
        stateless: _,
        ...transport_ctx
      } = (
        /** @type {ReceiveContext<CustomContext> & { stateless?: boolean }} */
        ctx ?? {}
      );
      let store2 = { ...transport_ctx, progress_token, request_id: id };
      if (requested_version !== void 0 || request_capabilities !== void 0 || request_client_info !== void 0 || request_log_level !== void 0) {
        if (requested_version === void 0 || request_capabilities === void 0) {
          return this.#error_response(
            id,
            new McpError(
              -32602,
              'Requests with per-request protocol metadata must include both "io.modelcontextprotocol/protocolVersion" and "io.modelcontextprotocol/clientCapabilities" in _meta'
            )
          );
        }
        if (typeof requested_version !== "string") {
          return this.#error_response(
            id,
            new McpError(
              -32602,
              'Invalid "io.modelcontextprotocol/protocolVersion" in _meta: expected a string'
            )
          );
        }
        const parsed_capabilities = typeof request_capabilities !== "object" || request_capabilities === null || Array.isArray(request_capabilities) ? void 0 : safeParse(
          ClientCapabilitiesSchema,
          request_capabilities
        );
        if (!parsed_capabilities?.success) {
          return this.#error_response(
            id,
            new McpError(
              -32602,
              'Invalid "io.modelcontextprotocol/clientCapabilities" in _meta: expected a client capabilities object'
            )
          );
        }
        const parsed_client_info = request_client_info === void 0 ? void 0 : safeParse(
          ImplementationSchema,
          request_client_info
        );
        if (parsed_client_info && !parsed_client_info.success) {
          return this.#error_response(
            id,
            new McpError(
              -32602,
              'Invalid "io.modelcontextprotocol/clientInfo" in _meta: expected an implementation object with "name" and "version"'
            )
          );
        }
        const parsed_log_level = request_log_level === void 0 ? void 0 : safeParse(LoggingLevelSchema, request_log_level);
        if (parsed_log_level && !parsed_log_level.success) {
          return this.#error_response(
            id,
            new McpError(
              -32602,
              'Invalid "io.modelcontextprotocol/logLevel" in _meta: expected a logging level'
            )
          );
        }
        const enabled = this.#enabled_protocol_versions();
        if (!enabled.includes(requested_version)) {
          return this.#error_response(
            id,
            unsupported_protocol_version_error(
              enabled,
              requested_version
            )
          );
        }
        store2 = {
          ...store2,
          stateless: true,
          protocolVersion: requested_version,
          sessionInfo: {
            clientCapabilities: parsed_capabilities.output,
            clientInfo: parsed_client_info?.output,
            logLevel: parsed_log_level?.output
          }
        };
      }
      const stateless = store2.stateless === true;
      if (!is_method_allowed(request_message.method, stateless) || !this.hasMethod(request_message.method)) {
        return this.#error_response(
          id,
          new McpError(
            -32601,
            `Method ${request_message.method} not found`
          )
        );
      }
      let encoded_incoming_state;
      const params = request_message.params;
      const raw_input_responses = params?.inputResponses;
      const raw_request_state = params?.requestState;
      if (!stateless && (raw_input_responses !== void 0 || raw_request_state !== void 0)) {
        return this.#error_response(
          id,
          new McpError(
            -32602,
            '"inputResponses" and "requestState" params are only supported by per-request (stateless) multi round-trip requests'
          )
        );
      }
      if (stateless) {
        let input_responses;
        if (raw_input_responses !== void 0 || raw_request_state !== void 0) {
          if (!MRTR_METHODS.has(request_message.method)) {
            return this.#error_response(
              id,
              new McpError(
                -32602,
                `"inputResponses" and "requestState" params are only accepted on multi round-trip methods (${[...MRTR_METHODS].join(", ")})`
              )
            );
          }
          if (raw_input_responses !== void 0) {
            const parsed = safeParse(
              InputResponsesSchema,
              raw_input_responses
            );
            if (!parsed.success) {
              return this.#error_response(
                id,
                new McpError(
                  -32602,
                  'Invalid "inputResponses": expected a map of input response objects keyed by input request key'
                )
              );
            }
            input_responses = parsed.output;
          }
          if (raw_request_state !== void 0) {
            if (typeof raw_request_state !== "string") {
              return this.#error_response(
                id,
                new McpError(
                  -32602,
                  'Invalid "requestState": expected the opaque string previously returned by the server'
                )
              );
            }
            if (raw_request_state.length > MAX_ENCODED_REQUEST_STATE_LENGTH) {
              return this.#error_response(
                id,
                new McpError(
                  -32602,
                  `Invalid "requestState": encoded state exceeds the maximum accepted length of ${MAX_ENCODED_REQUEST_STATE_LENGTH} characters`
                )
              );
            }
            encoded_incoming_state = raw_request_state;
          }
          if (params) {
            delete params.inputResponses;
            delete params.requestState;
          }
        }
        if (MRTR_METHODS.has(request_message.method)) {
          store2.mrtr = {
            input_responses,
            incoming_state: void 0,
            ordinal: 0,
            used_keys: /* @__PURE__ */ new Set(),
            pending: /* @__PURE__ */ new Map(),
            consumed_responses: /* @__PURE__ */ new Map(),
            outgoing_state: void 0,
            registration: void 0,
            input_error: void 0,
            signal: new InputRequiredSignal(),
            signal_at_boundary: false
          };
        }
      }
      return this.#ctx_storage.run(store2, async () => {
        const mrtr = store2.mrtr;
        if (mrtr !== void 0 && encoded_incoming_state !== void 0) {
          let decoded_state;
          try {
            decoded_state = await this.#request_state_codec.decode(
              encoded_incoming_state
            );
          } catch (error) {
            return this.#error_response(
              id,
              new McpError(
                -32602,
                `Invalid "requestState": the configured codec failed to decode it (${/** @type {Error} */
                error?.message})`
              )
            );
          }
          const parsed_state = safeParse(
            RequestStateEnvelopeSchema,
            decoded_state
          );
          if (!parsed_state.success) {
            return this.#error_response(
              id,
              new McpError(
                -32602,
                'Invalid "requestState": expected state previously returned by tmcp'
              )
            );
          }
          mrtr.incoming_state = parsed_state.output.state;
          mrtr.outgoing_state = parsed_state.output.state;
          mrtr.input_responses = Object.assign(
            /* @__PURE__ */ Object.create(null),
            parsed_state.output.inputResponses,
            mrtr.input_responses
          );
        }
        const response = await this.#server.receive(request_message);
        if (mrtr?.input_error !== void 0) {
          return this.#error_response(id, mrtr.input_error);
        }
        if (mrtr !== void 0 && mrtr.pending.size > 0 && response != null) {
          if ("result" in response) {
            return this.#error_response(
              id,
              new McpError(
                -32603,
                `Handler${mrtr.registration ? ` for ${mrtr.registration.kind} "${mrtr.registration.name}"` : ""} returned a result while input requests are pending: a catch block swallowed the internal input-required signal thrown by elicitation()/message(), or an input call was not awaited. Always await input calls. Catch blocks must rethrow the signal \u2014 use isInputRequired(error) to detect it and rethrow selectively.`
              )
            );
          }
          if (mrtr.signal_at_boundary) {
            let input_requests;
            try {
              const entries = await Promise.all(
                [...mrtr.pending].map(
                  async ([key, request2]) => (
                    /** @type {[string, { method: string, params: Record<string, unknown> }]} */
                    [
                      key,
                      await request2
                    ]
                  )
                )
              );
              input_requests = Object.fromEntries(entries);
            } catch (error) {
              return this.#error_response(
                id,
                new McpError(
                  -32603,
                  `Failed to prepare an input request: ${/** @type {Error} */
                  error?.message ?? "unknown error"}`
                )
              );
            }
            const result = {
              resultType: "input_required",
              inputRequests: input_requests,
              _meta: {
                "io.modelcontextprotocol/serverInfo": this.#server_info
              }
            };
            if (mrtr.outgoing_state !== void 0 || mrtr.consumed_responses.size > 0) {
              let encoded;
              try {
                encoded = await this.#request_state_codec.encode({
                  version: 1,
                  inputResponses: Object.fromEntries(
                    mrtr.consumed_responses
                  ),
                  ...mrtr.outgoing_state !== void 0 ? { state: mrtr.outgoing_state } : {}
                });
              } catch (error) {
                return this.#error_response(
                  id,
                  new McpError(
                    -32603,
                    `Failed to encode requestState with the configured codec: ${/** @type {Error} */
                    error?.message}`
                  )
                );
              }
              if (typeof encoded !== "string" || encoded.length > MAX_ENCODED_REQUEST_STATE_LENGTH) {
                return this.#error_response(
                  id,
                  new McpError(
                    -32603,
                    `The requestState codec must produce a string of at most ${MAX_ENCODED_REQUEST_STATE_LENGTH} characters`
                  )
                );
              }
              result.requestState = encoded;
            }
            return {
              jsonrpc: (
                /** @type {const} */
                "2.0"
              ),
              id: (
                /** @type {string | number} */
                id
              ),
              result
            };
          }
        }
        if (stateless && response != null && "result" in response) {
          if (response.result == null || typeof response.result !== "object") {
            response.result = {};
          }
          this.#decorate_result(
            request_message.method,
            /** @type {Record<string, unknown>} */
            response.result,
            (mrtr?.consumed_responses.size ?? 0) > 0
          );
        }
        return response;
      });
    }
    const validated_response = parse(
      union([JSONRPCResponseSchema, JSONRPCErrorSchema]),
      message
    );
    this.#lazyily_create_client();
    return this.#ctx_storage.run(
      ctx ?? {},
      async () => this.#client?.receive(validated_response)
    );
  }
  /**
   * Lower level api to send a request to the client, mostly useful to call client methods that not yet supported by the server or
   * if you want to send requests with json schema that is not expressible with your validation library.
   * @param {{ method: string, params?: JSONRPCParams }} request
   * @returns {Promise<unknown>}
   */
  async request({ method, params }) {
    if (this.#is_stateless) {
      throw new McpError(
        -32603,
        "Low-level server-to-client requests are not supported for per-request protocol requests: there is no server-to-client JSON-RPC channel, and arbitrary requests cannot be translated into multi round-trip input requests"
      );
    }
    this.#lazyily_create_client();
    return this.#client?.request(method, params, "standalone");
  }
  /**
   * Send a notification for subscriptions
   * @template {keyof ChangedArgs} TWhat
   * @param {[what: TWhat, ...ChangedArgs[TWhat]]} args
   */
  changed(...args) {
    const [what, id] = args;
    if (what === "prompts") {
      this.#notify_prompts_list_changed();
    } else if (what === "tools") {
      this.#notify_tools_list_changed();
    } else if (what === "resources") {
      this.#notify_resources_list_changed();
    } else {
      const resource = this.#resources.get(id);
      const subscription_resource = this.#subscription_resource_registration(id);
      if (!resource && !subscription_resource) return;
      if (resource) {
        this.#broadcast_change(`notifications/resources/updated`, {
          uri: id,
          title: resource.name
        });
      }
      if (!resource && subscription_resource) {
        this.#broadcast_change(
          "notifications/resources/updated",
          { uri: id },
          true
        );
      }
    }
  }
  /**
   * Refresh the roots list when the server has an open client session.
   *
   * This throws when handling a standalone request because roots are no
   * longer supported by protocol version `2026-07-28`.
   */
  async refreshRoots() {
    await this.#refresh_roots();
  }
  /**
   * Whether the client included its version and capabilities in this request
   * instead of opening a session first.
   */
  get #is_stateless() {
    return this.#ctx_storage.getStore()?.stateless === true;
  }
  /**
   * Check that the client supports the requested input and that the current
   * method is allowed to ask for it.
   * @param {'elicitation' | 'sampling'} capability
   * @param {string} description Human-readable description for the session-negotiated error message
   * @param {'form' | 'url'} [elicitation_mode]
   */
  #assert_client_request_allowed(capability, description2, elicitation_mode) {
    const declared_capability = this.#client_capabilities?.[capability];
    const capability_is_object = typeof declared_capability === "object" && declared_capability !== null && !Array.isArray(declared_capability);
    const supports_elicitation_mode = capability_is_object && (capability !== "elicitation" || (elicitation_mode === "url" ? declared_capability.url !== void 0 : Object.keys(declared_capability).length === 0 || declared_capability.form !== void 0));
    const supported = supports_elicitation_mode;
    if (!supported) {
      if (this.#is_stateless) {
        throw missing_required_client_capability_error({
          [capability]: capability === "elicitation" ? { [elicitation_mode ?? "form"]: {} } : {}
        });
      }
      throw new McpError(-32601, `Client doesn't support ${description2}`);
    }
    if (this.#is_stateless && this.#mrtr === void 0) {
      throw new McpError(
        -32603,
        `${description2} input requests are only available inside tools/call, prompts/get, and resources/read during per-request (stateless) execution`
      );
    }
  }
  /**
   * Work data used while the current request waits for client input.
   * It is absent when the current method cannot ask for input.
   */
  get #mrtr() {
    return this.#ctx_storage.getStore()?.mrtr;
  }
  /**
   * Remember which handler is running so input calls can check its
   * `replayable` setting and include its name in errors.
   * @param {string} kind
   * @param {string} name
   * @param {boolean | undefined} replayable
   */
  #mark_mrtr_registration(kind, name2, replayable) {
    const mrtr = this.#mrtr;
    if (mrtr === void 0) return;
    mrtr.registration = { kind, name: name2, replayable: replayable === true };
  }
  /**
   * Convert tmcp's retry data to and from text. Plain JSON is used by default,
   * which means the client can read and change the value.
   */
  get #request_state_codec() {
    return this.#options.requestStateCodec ?? {
      /** @type {(state: unknown)=>string} */
      encode: (state) => JSON.stringify(state),
      /** @type {(encoded: string)=>unknown} */
      decode: (encoded) => JSON.parse(encoded)
    };
  }
  /**
   * Check that the handler allows tmcp to run it again after client input.
   * @param {MrtrState} mrtr
   * @param {string} description
   */
  #assert_replayable(mrtr, description2) {
    if (mrtr.registration?.replayable) return;
    const registration = mrtr.registration ? `${mrtr.registration.kind} "${mrtr.registration.name}"` : "registration";
    throw new McpError(
      -32603,
      `${registration} asked the client for ${description2}, but it is not marked as replayable. The client must retry the ORIGINAL request with its answer, which starts the handler again FROM THE TOP. Work done before the input call, such as database writes, emails, or payments, may therefore happen more than once. Set \`replayable: true\` on the ${mrtr.registration?.kind ?? "tool/prompt/resource"} definition only when that work is safe to repeat or is delayed until after all input is available. This is a tmcp safety check, not an MCP requirement.`
    );
  }
  /**
   * Use the provided input name, or assign the next number (`"1"`, `"2"`,
   * and so on). Numbering starts again each time the client retries.
   * @param {MrtrState} mrtr
   * @param {string | undefined} explicit_key
   */
  #next_input_key(mrtr, explicit_key) {
    if (explicit_key != null) {
      if (mrtr.used_keys.has(explicit_key)) {
        const error = new McpError(
          -32603,
          `Duplicate input request key "${explicit_key}": each elicitation()/message() call within one request attempt must use a distinct key`
        );
        mrtr.input_error = error;
        throw error;
      }
      mrtr.used_keys.add(explicit_key);
      return explicit_key;
    }
    let key;
    do {
      mrtr.ordinal += 1;
      key = String(mrtr.ordinal);
    } while (mrtr.used_keys.has(key));
    mrtr.used_keys.add(key);
    return key;
  }
  /**
   * Let a handler recover from an invalid client answer by asking again with
   * the same key instead of consuming the same invalid value repeatedly.
   * @param {MrtrState} mrtr
   * @param {string} key
   */
  #release_input_response(mrtr, key) {
    mrtr.used_keys.delete(key);
    if (mrtr.input_responses !== void 0) {
      delete mrtr.input_responses[key];
    }
  }
  /**
   * Save data that the handler will need when the client retries this
   * request. tmcp turns it into text, sends it to the client, and restores it
   * as `server.ctx.requestState` on the retry.
   * Passing `undefined` clears previously set state.
   *
   * This does nothing when the server has an open client session or when the
   * request finishes without asking for input.
   *
   * SECURITY: the default JSON converter lets the client read and change this
   * data. Do not put secrets in it or use it for authorization. Configure a
   * protected `requestStateCodec` if the server must detect changes.
   * @param {unknown} state
   */
  setRequestState(state) {
    const mrtr = this.#mrtr;
    if (mrtr === void 0) return;
    mrtr.outgoing_state = state;
  }
  /**
   * Build and validate an elicitation request sent to the client.
   * @template {StandardSchema extends undefined ? never : StandardSchema} TSchema
   * @param {string} message
   * @param {TSchema | string} schema_or_url
   */
  async #create_elicitation_request(message, schema_or_url) {
    const request2 = typeof schema_or_url === "string" ? {
      method: (
        /** @type {const} */
        "elicitation/create"
      ),
      params: {
        mode: (
          /** @type {const} */
          "url"
        ),
        message,
        url: schema_or_url
      }
    } : {
      method: (
        /** @type {const} */
        "elicitation/create"
      ),
      params: {
        message,
        requestedSchema: await this.#options.adapter?.toJsonSchema(
          schema_or_url
        )
      }
    };
    const parsed = safeParse(ElicitRequestSchema, request2);
    if (!parsed.success) {
      if (typeof schema_or_url === "string") {
        throw new McpError(
          -32602,
          `URL ${schema_or_url} is not a valid URL`
        );
      }
      throw new McpError(
        -32603,
        `Invalid elicitation schema: form elicitation requires a flat object containing only supported primitive fields (${JSON.stringify(parsed.issues)})`
      );
    }
    return parsed.output;
  }
  /**
   * Ask the user to complete an interaction at a URL. The client will open
   * the URL out of band and return the user's action without form content.
   *
   * @overload
   * @param {string} message
   * @param {string} url
   * @param {{ key?: string }} [options] `key` names this question so tmcp can match its answer on a retry.
   * @returns {Promise<Omit<ElicitResult, 'content'>>}
   */
  /**
   * Emit an elicitation request to the client. Elicitations are used to ask the user for input in a structured way, the client will show a UI to the user to fill the input.
   * The schema should be a valid Standard Schema V1 schema and should be an Object with the properties you need.
   * The client will return the validated input as a JSON object that matches the schema.
   *
   * If the client doesn't support elicitation, it will throw an error.
   *
   * When there is no open client session, tmcp returns the question to the
   * client and asks it to retry the original request with the answer. The
   * handler then starts again from the beginning, so its definition must set
   * `replayable: true`. Always await this call. If a surrounding `catch`
   * handles errors, use `isInputRequired()` and rethrow tmcp's private error.
   *
   * @template {StandardSchema extends undefined ? never : StandardSchema} TSchema
   * @overload
   * @param {string} message
   * @param {TSchema} schema
   * @param {{ key?: string }} [options] `key` names this question so tmcp can match its answer on a retry. By default tmcp uses `"1"`, `"2"`, and so on. Set a name when the handler may ask different questions on different runs. When mixing named and numbered questions, use non-numeric names.
   * @returns {Promise<ElicitResult & { content?: StandardSchemaV1.InferOutput<TSchema> }>}
   */
  /**
   * @template {StandardSchema extends undefined ? never : StandardSchema} TSchema
   * @param {string} message
   * @param {TSchema | string} schema_or_url
   * @param {{ key?: string }} [options]
   * @returns {Promise<Omit<ElicitResult, 'content'> | (ElicitResult & { content?: StandardSchemaV1.InferOutput<TSchema> })>}
   */
  async elicitation(message, schema_or_url, options = {}) {
    const mode = typeof schema_or_url === "string" ? "url" : "form";
    this.#assert_client_request_allowed(
      "elicitation",
      `${mode} mode elicitation`,
      mode
    );
    const mrtr = this.#mrtr;
    if (mrtr !== void 0) {
      this.#assert_replayable(mrtr, "elicitation");
      const key = this.#next_input_key(mrtr, options.key);
      const has_response = mrtr.input_responses !== void 0 && Object.hasOwn(mrtr.input_responses, key);
      if (has_response) {
        try {
          const provided = mrtr.input_responses?.[key];
          const parsed = safeParse(ElicitResultSchema, provided);
          if (!parsed.success) {
            throw new McpError(
              -32602,
              `Invalid input response for key "${key}": expected an elicitation result ({ action, content? })`
            );
          }
          const result2 = typeof schema_or_url !== "string" ? await this.#validate_elicit_result(
            parsed.output,
            schema_or_url,
            -32602
          ) : this.#without_elicit_content(parsed.output);
          mrtr.consumed_responses.set(
            key,
            typeof schema_or_url === "string" ? result2 : parsed.output
          );
          return result2;
        } catch (error) {
          this.#release_input_response(mrtr, key);
          throw error;
        }
      }
      const pending_request = this.#create_elicitation_request(
        message,
        schema_or_url
      );
      mrtr.pending.set(key, pending_request);
      try {
        await pending_request;
      } catch (error) {
        if (mrtr.pending.get(key) === pending_request) {
          mrtr.pending.delete(key);
          mrtr.used_keys.delete(key);
        }
        throw error;
      }
      throw mrtr.signal;
    }
    this.#lazyily_create_client();
    const request2 = await this.#create_elicitation_request(
      message,
      schema_or_url
    );
    const result = await this.#client?.request(
      request2.method,
      request2.params,
      "standalone"
    );
    const elicit_result = parse(ElicitResultSchema, result);
    return typeof schema_or_url !== "string" ? this.#validate_elicit_result(elicit_result, schema_or_url) : this.#without_elicit_content(elicit_result);
  }
  /**
   * URL elicitation is out of band, so form content must never reach the
   * handler or be carried into a later stateless retry.
   * @param {ElicitResult} elicit_result
   * @returns {Omit<ElicitResult, 'content'>}
   */
  #without_elicit_content(elicit_result) {
    const result = { ...elicit_result };
    delete result.content;
    return result;
  }
  /**
   * Validate the `content` of an elicit result against the schema the
   * input was requested with.
   * @template {StandardSchema extends undefined ? never : StandardSchema} TSchema
   * @param {ElicitResult} elicit_result
   * @param {TSchema} schema
   * @param {number} [invalid_content_code]
   * @returns {Promise<ElicitResult & { content?: StandardSchemaV1.InferOutput<TSchema> }>}
   */
  async #validate_elicit_result(elicit_result, schema, invalid_content_code = -32603) {
    if (elicit_result.action !== "accept") return elicit_result;
    let validated_result = schema["~standard"].validate(
      elicit_result.content
    );
    if (validated_result instanceof Promise)
      validated_result = await validated_result;
    if (validated_result.issues) {
      throw new McpError(
        invalid_content_code,
        `Invalid elicitation result: ${JSON.stringify(validated_result.issues)}`
      );
    }
    return { ...elicit_result, content: validated_result.value };
  }
  /**
   * Request language model sampling from the client.
   *
   * When there is no open client session, tmcp returns the sampling request
   * to the client and asks it to retry the original request with the answer.
   * The handler then starts again from the beginning, so its definition must
   * set `replayable: true`. Always await this call. If a surrounding `catch`
   * handles errors, use `isInputRequired()` and rethrow tmcp's private error.
   * @param {CreateMessageRequestParams} request
   * @param {{ key?: string }} [options] `key` names this request so tmcp can match its answer on a retry. By default tmcp uses `"1"`, `"2"`, and so on. Set a name when the handler may make different requests on different runs. When mixing named and numbered requests, use non-numeric names.
   * @returns {Promise<CreateMessageResult>}
   */
  async message(request2, options = {}) {
    this.#assert_client_request_allowed("sampling", "sampling");
    const validated_request = parse(
      CreateMessageRequestParamsSchema,
      request2
    );
    const mrtr = this.#mrtr;
    if (mrtr !== void 0) {
      this.#assert_replayable(mrtr, "sampling");
      const key = this.#next_input_key(mrtr, options.key);
      const has_response = mrtr.input_responses !== void 0 && Object.hasOwn(mrtr.input_responses, key);
      if (has_response) {
        try {
          const provided = mrtr.input_responses?.[key];
          const parsed = safeParse(
            CreateMessageResultSchema,
            provided
          );
          if (!parsed.success) {
            throw new McpError(
              -32602,
              `Invalid input response for key "${key}": expected a sampling result (CreateMessageResult)`
            );
          }
          mrtr.consumed_responses.set(key, parsed.output);
          return parsed.output;
        } catch (error) {
          this.#release_input_response(mrtr, key);
          throw error;
        }
      }
      mrtr.pending.set(
        key,
        Promise.resolve({
          method: "sampling/createMessage",
          params: validated_request
        })
      );
      throw mrtr.signal;
    }
    this.#lazyily_create_client();
    const response = await this.#client?.request(
      "sampling/createMessage",
      validated_request,
      "standalone"
    );
    return parse(CreateMessageResultSchema, response);
  }
  /**
   * Send a progress notification to the client. This is useful for long-running operations where you want to inform the user about the progress.
   *
   * @param {number} progress The current progress value, it should be between 0 and total and should always increase
   * @param {number} [total] The total value, defaults to 1
   * @param {string} [message] An optional message to accompany the progress update
   */
  progress(progress, total = 1, message = void 0) {
    if (this.#progress_token != null) {
      this.#notify("notifications/progress", {
        progress,
        total,
        message,
        progressToken: this.#progress_token
      });
    }
  }
  /**
   * Log a message to the client if logging is enabled and the level is appropriate
   *
   * @param {LoggingLevel} level
   * @param {unknown} data
   * @param {string} [logger]
   */
  log(level, data, logger) {
    if (!this.#options.capabilities?.logging) {
      throw new McpError(
        -32601,
        "The server doesn't support logging, please enable it in capabilities"
      );
    }
    const store2 = this.#ctx_storage.getStore();
    const current_session_level = store2?.stateless ? store2.sessionInfo?.logLevel : store2?.sessionInfo?.logLevel ?? this.#options.logging?.default ?? "info";
    if (current_session_level && this.#should_log(level, current_session_level)) {
      this.#notify("notifications/message", {
        level,
        data,
        logger
      });
    }
  }
  /**
   * Check if a log message should be sent based on severity levels
   * @param {LoggingLevel} message_level
   * @param {LoggingLevel} session_level
   * @returns {boolean}
   */
  #should_log(message_level, session_level) {
    const levels = [
      "debug",
      "info",
      "notice",
      "warning",
      "error",
      "critical",
      "alert",
      "emergency"
    ];
    const message_severity = levels.indexOf(message_level);
    const session_severity = levels.indexOf(session_level);
    return message_severity >= session_severity;
  }
};

// src/common/types.ts
var ProviderError = class extends Error {
  constructor(type, message, provider, details) {
    super(message);
    this.type = type;
    this.provider = provider;
    this.details = details;
    this.name = "ProviderError";
  }
};

// src/common/errors.ts
var provider_error = (type, message, provider, details = {}) => new ProviderError(type, message, provider, details);
var normalize_provider_http_error = (provider, status, message) => {
  switch (status) {
    case 400:
    case 422:
      return provider_error(
        "INVALID_INPUT" /* INVALID_INPUT */,
        `Invalid request: ${message}`,
        provider,
        { status, retryable: false }
      );
    case 401:
    case 403:
      return provider_error(
        "AUTH_ERROR" /* AUTH_ERROR */,
        status === 401 ? "Invalid API key" : "API key does not have access to this endpoint",
        provider,
        { status, retryable: false }
      );
    case 408:
      return provider_error(
        "TIMEOUT" /* TIMEOUT */,
        `${provider} API request timed out`,
        provider,
        { status, retryable: true }
      );
    case 429:
      return provider_error(
        "RATE_LIMIT" /* RATE_LIMIT */,
        `Rate limit exceeded for ${provider}`,
        provider,
        { status, retryable: true }
      );
    default:
      if (status >= 500) {
        return provider_error(
          "TRANSIENT_PROVIDER_ERROR" /* TRANSIENT_PROVIDER_ERROR */,
          `${provider} API internal error`,
          provider,
          { status, retryable: true }
        );
      }
      return provider_error(
        "API_ERROR" /* API_ERROR */,
        `Unexpected error: ${message}`,
        provider,
        { status, retryable: false }
      );
  }
};
function handle_provider_error(error, provider_name, operation = "operation") {
  if (error instanceof ProviderError) {
    throw error;
  }
  throw new ProviderError(
    "API_ERROR" /* API_ERROR */,
    `Failed to ${operation}: ${error instanceof Error ? error.message : "Unknown error"}`,
    provider_name
  );
}
var sanitize_query = (query) => {
  return query.trim().replace(/[\n\r]+/g, " ");
};
var create_error_response = (error) => {
  if (error instanceof ProviderError) {
    return {
      error: error.message,
      type: error.type,
      provider: error.provider,
      retryable: error.details?.retryable ?? false
    };
  }
  return {
    error: `Unexpected error: ${error.message}`,
    type: "API_ERROR" /* API_ERROR */,
    retryable: false
  };
};

// src/common/http.ts
var tryParseJson = (text) => {
  if (!text) return void 0;
  try {
    return JSON.parse(text);
  } catch {
    return void 0;
  }
};
var get_error_message = (body) => {
  if (typeof body !== "object" || body === null) return void 0;
  for (const key of ["message", "error", "detail"]) {
    if (key in body) {
      const value = body[key];
      if (typeof value === "string") return value;
    }
  }
};
var http_json = async (provider, url2, options = {}) => {
  const res = await fetch(url2, options);
  const raw = await res.text();
  const body = tryParseJson(raw);
  const okOrExpected = res.ok || options.expectedStatuses && options.expectedStatuses.includes(res.status);
  if (!okOrExpected) {
    const message = get_error_message(body) || raw || res.statusText;
    throw normalize_provider_http_error(
      provider,
      res.status,
      message
    );
  }
  return body ?? raw;
};

// src/common/provider-response.ts
var parse_provider_response = (provider, schema, data) => {
  const result = safeParse(schema, data);
  if (result.success) return result.output;
  throw new ProviderError(
    "PROVIDER_ERROR" /* PROVIDER_ERROR */,
    `Malformed ${provider} response: ${summarize(result.issues)}`,
    provider,
    { issue_count: result.issues.length }
  );
};

// src/common/retry.ts
var delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
var is_object_with_name = (error) => typeof error === "object" && error !== null && "name" in error && typeof error.name === "string";
var is_retryable_error = (error) => {
  if (error instanceof ProviderError) {
    if (typeof error.details?.retryable === "boolean") {
      return error.details.retryable;
    }
    if (error.type === "RATE_LIMIT" /* RATE_LIMIT */ || error.type === "TIMEOUT" /* TIMEOUT */ || error.type === "TRANSIENT_PROVIDER_ERROR" /* TRANSIENT_PROVIDER_ERROR */) {
      return true;
    }
    const status = error.details?.status;
    return status !== void 0 && (status === 408 || status === 429 || status >= 500);
  }
  if (is_object_with_name(error)) {
    return error.name === "AbortError" || error.name === "TimeoutError" || error.name === "TypeError";
  }
  return false;
};
var normalize_retry_options = (max_retries_or_options = {}, initial_delay) => {
  const options = typeof max_retries_or_options === "number" ? {
    max_retries: max_retries_or_options,
    initial_delay: initial_delay ?? 1e3
  } : max_retries_or_options;
  return {
    max_retries: options.max_retries ?? 3,
    initial_delay: options.initial_delay ?? 1e3,
    jitter_ratio: options.jitter_ratio ?? 0.2,
    random: options.random ?? Math.random,
    should_retry: options.should_retry ?? is_retryable_error
  };
};
var apply_jitter = (delay_time, jitter_ratio, random) => {
  if (jitter_ratio <= 0) return delay_time;
  const jitter = 1 + (random() * 2 - 1) * jitter_ratio;
  return Math.max(0, Math.round(delay_time * jitter));
};
var retry_with_backoff = async (fn, max_retries_or_options, initial_delay) => {
  const options = normalize_retry_options(
    max_retries_or_options,
    initial_delay
  );
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (retries >= options.max_retries || !options.should_retry(error)) {
        throw error;
      }
      const base_delay = options.initial_delay * Math.pow(2, retries);
      const delay_time = apply_jitter(
        base_delay,
        options.jitter_ratio,
        options.random
      );
      await delay(delay_time);
      retries++;
    }
  }
};

// src/common/validation.ts
var normalize_api_key = (raw) => {
  const trimmed = raw.trim();
  return trimmed.replace(/^(['"])(.*)\1$/, "$2");
};
var validate_api_key = (key, provider) => {
  if (!key) {
    throw new ProviderError(
      "INVALID_INPUT" /* INVALID_INPUT */,
      `API key not found for ${provider}`,
      provider
    );
  }
  return normalize_api_key(key);
};
var is_api_key_valid = (key, provider) => {
  if (!key || key.trim() === "") {
    console.warn(`API key not found or empty for ${provider}`);
    return false;
  }
  return true;
};
var is_valid_url = (url2) => {
  try {
    new URL(url2);
    return true;
  } catch {
    return false;
  }
};
var validate_processing_urls = (url2, provider_name) => {
  const urls = Array.isArray(url2) ? url2 : [url2];
  for (const u of urls) {
    if (!is_valid_url(u)) {
      throw new ProviderError(
        "INVALID_INPUT" /* INVALID_INPUT */,
        `Invalid URL provided: ${u}`,
        provider_name
      );
    }
  }
  return urls;
};

// src/providers/ai-response/exa-answer/index.ts
var exa_answer_response_schema = object({
  answer: string(),
  citations: optional(
    array(
      object({
        id: string(),
        title: string(),
        url: string(),
        publishedDate: optional(string()),
        text: optional(string()),
        image: optional(string()),
        favicon: optional(string())
      })
    )
  ),
  requestId: string()
});
var ExaAnswerProvider = class {
  name = "exa_answer";
  description = "Get direct AI-generated answers to questions using Exa Answer API";
  async search(params) {
    const api_key = validate_api_key(
      config.ai_response.exa_answer.api_key,
      this.name
    );
    const search_request = async () => {
      try {
        const raw_data = await http_json(
          this.name,
          `${config.ai_response.exa_answer.base_url}/answer`,
          {
            method: "POST",
            headers: {
              "x-api-key": api_key,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              query: sanitize_query(params.query)
            }),
            signal: AbortSignal.timeout(
              config.ai_response.exa_answer.timeout
            )
          }
        );
        const data = parse_provider_response(
          this.name,
          exa_answer_response_schema,
          raw_data
        );
        const results = [
          {
            title: "AI Answer",
            url: "",
            snippet: data.answer,
            score: 1,
            source_provider: this.name,
            metadata: {
              requestId: data.requestId,
              type: "ai_answer",
              citations_count: data.citations?.length || 0
            }
          }
        ];
        if (data.citations && data.citations.length > 0) {
          const limit = params.limit ?? data.citations.length;
          const citation_results = data.citations.slice(0, limit).map((citation, index) => ({
            title: citation.title,
            url: citation.url,
            snippet: citation.text || "Source reference",
            score: 0.9 - index * 0.01,
            source_provider: this.name,
            metadata: {
              id: citation.id,
              publishedDate: citation.publishedDate,
              type: "citation"
            }
          }));
          results.push(...citation_results);
        }
        return results;
      } catch (error) {
        handle_provider_error(error, this.name, "fetch AI response");
      }
    };
    return retry_with_backoff(search_request);
  }
};

// src/providers/ai-response/kagi-fastgpt/index.ts
var kagi_fastgpt_response_schema = object({
  meta: object({
    id: string(),
    node: string(),
    ms: number()
  }),
  data: object({
    output: string(),
    tokens: number(),
    references: array(
      object({
        title: string(),
        snippet: string(),
        url: string()
      })
    )
  })
});
var KagiFastGPTProvider = class {
  name = "kagi_fastgpt";
  description = "Quick AI-generated answers with citations, optimized for rapid response (900ms typical start time). Runs full search underneath for enriched answers.";
  async search(params) {
    const response = await this.get_answer(params.query);
    const results = [];
    results.push({
      title: "Kagi FastGPT Response",
      url: "https://kagi.com/fastgpt",
      snippet: response.data.output,
      source_provider: this.name
    });
    if (response.data.references && response.data.references.length > 0) {
      results.push(
        ...response.data.references.map((ref) => ({
          title: ref.title,
          url: ref.url,
          snippet: ref.snippet,
          source_provider: this.name
        }))
      );
    }
    const filtered_results = results.filter(
      (result) => result.title && result.url && result.snippet
    );
    if (params.limit && params.limit > 0) {
      return filtered_results.slice(0, params.limit);
    }
    return filtered_results;
  }
  async get_answer(query, options = {}) {
    const api_key = validate_api_key(
      config.ai_response.kagi_fastgpt.api_key,
      this.name
    );
    const default_options = {
      cache: true,
      web_search: true
      // Currently only true is supported
    };
    const final_options = { ...default_options, ...options };
    try {
      const raw_data = await http_json(
        this.name,
        "https://kagi.com/api/v0/fastgpt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bot ${api_key}`
          },
          body: JSON.stringify({
            query,
            cache: final_options.cache,
            web_search: final_options.web_search
          }),
          signal: AbortSignal.timeout(
            config.ai_response.kagi_fastgpt.timeout
          )
        }
      );
      return parse_provider_response(
        this.name,
        kagi_fastgpt_response_schema,
        raw_data
      );
    } catch (error) {
      const error_message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to get Kagi FastGPT answer: ${error_message}`
      );
    }
  }
};

// src/providers/ai-response/linkup/index.ts
var linkup_sourced_answer_response_schema = object({
  answer: string(),
  sources: array(
    object({
      favicon: string(),
      name: string(),
      snippet: string(),
      url: string()
    })
  )
});
var LinkupProvider = class {
  name = "linkup";
  description = "AI-powered deep search with sourced answers via Linkup. Uses agentic search with standard depth for balanced speed and accuracy.";
  async search(params) {
    const api_key = validate_api_key(
      config.ai_response.linkup.api_key,
      this.name
    );
    const search_request = async () => {
      try {
        const request_body = {
          q: sanitize_query(params.query),
          depth: "standard",
          outputType: "sourcedAnswer"
        };
        if (params.include_domains && params.include_domains.length > 0) {
          request_body.includeDomains = params.include_domains;
        }
        if (params.exclude_domains && params.exclude_domains.length > 0) {
          request_body.excludeDomains = params.exclude_domains;
        }
        if (params.limit) {
          request_body.maxResults = params.limit;
        }
        const raw_data = await http_json(
          this.name,
          `${config.ai_response.linkup.base_url}/search`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${api_key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(request_body),
            signal: AbortSignal.timeout(
              config.ai_response.linkup.timeout
            )
          }
        );
        const data = parse_provider_response(
          this.name,
          linkup_sourced_answer_response_schema,
          raw_data
        );
        const results = [
          {
            title: "Linkup AI Answer",
            url: "",
            snippet: data.answer,
            score: 1,
            source_provider: this.name,
            metadata: {
              type: "ai_answer",
              depth: "standard",
              sources_count: data.sources?.length || 0
            }
          }
        ];
        if (data.sources && data.sources.length > 0) {
          const source_results = data.sources.map(
            (source, index) => ({
              title: source.name,
              url: source.url,
              snippet: source.snippet || "Source reference",
              score: 0.9 - index * 0.01,
              source_provider: this.name,
              metadata: {
                type: "source",
                favicon: source.favicon
              }
            })
          );
          results.push(...source_results);
        }
        return results;
      } catch (error) {
        handle_provider_error(error, this.name, "fetch AI response");
      }
    };
    return retry_with_backoff(search_request);
  }
};

// src/providers/ai-response/tavily-research/index.ts
var tavily_research_created_schema = object({
  request_id: string(),
  status: string(),
  created_at: optional(string())
});
var tavily_research_status_schema = variant("status", [
  object({
    request_id: string(),
    status: literal("completed"),
    content: string(),
    sources: array(
      object({
        title: string(),
        url: string(),
        favicon: optional(string())
      })
    ),
    response_time: number()
  }),
  object({
    request_id: string(),
    status: literal("failed"),
    error: optional(string()),
    response_time: optional(number())
  }),
  object({
    request_id: string(),
    status: picklist(["pending", "in_progress"]),
    response_time: optional(number())
  })
]);
var pending_result = (request_id, status) => [
  {
    title: "Tavily Research Task",
    url: "",
    snippet: `Research is ${status}. Call ai_search again with provider "tavily_research" and research_id "${request_id}" to retrieve the report.`,
    score: 1,
    source_provider: "tavily_research",
    metadata: {
      type: "research_task",
      request_id,
      status
    }
  }
];
var TavilyResearchProvider = class {
  name = "tavily_research";
  description = "Start or retrieve asynchronous Tavily research with synthesized reports and sources.";
  async search(params) {
    const api_key = validate_api_key(
      config.ai_response.tavily_research.api_key,
      this.name
    );
    try {
      if (params.research_id) {
        const status = await this.get_status(
          params.research_id,
          api_key
        );
        return this.map_status(status, params.limit);
      }
      const created = await retry_with_backoff(
        async () => {
          const raw_created = await http_json(
            this.name,
            `${config.ai_response.tavily_research.base_url}/research`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${api_key}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                input: sanitize_query(params.query),
                model: "mini",
                stream: false,
                citation_format: "numbered",
                output_length: "standard"
              }),
              signal: AbortSignal.timeout(
                config.ai_response.tavily_research.request_timeout
              )
            }
          );
          return parse_provider_response(
            this.name,
            tavily_research_created_schema,
            raw_created
          );
        },
        { max_retries: 1, initial_delay: 250 }
      );
      return pending_result(created.request_id, created.status);
    } catch (error) {
      handle_provider_error(error, this.name, "complete research");
    }
  }
  async get_status(research_id, api_key) {
    return retry_with_backoff(
      async () => {
        const raw_status = await http_json(
          this.name,
          `${config.ai_response.tavily_research.base_url}/research/${research_id}`,
          {
            headers: { Authorization: `Bearer ${api_key}` },
            expectedStatuses: [202],
            signal: AbortSignal.timeout(
              config.ai_response.tavily_research.request_timeout
            )
          }
        );
        return parse_provider_response(
          this.name,
          tavily_research_status_schema,
          raw_status
        );
      },
      { max_retries: 1, initial_delay: 250 }
    );
  }
  map_status(status, limit) {
    if (status.status === "failed") {
      throw new ProviderError(
        "PROVIDER_ERROR" /* PROVIDER_ERROR */,
        status.error || "Tavily research task failed",
        this.name
      );
    }
    if (status.status !== "completed") {
      return pending_result(status.request_id, status.status);
    }
    const results = [
      {
        title: "Tavily Research Report",
        url: "",
        snippet: status.content,
        score: 1,
        source_provider: this.name,
        metadata: {
          type: "ai_answer",
          request_id: status.request_id,
          response_time: status.response_time,
          sources_count: status.sources.length
        }
      }
    ];
    const source_limit = limit ?? status.sources.length;
    results.push(
      ...status.sources.slice(0, source_limit).map((source, index) => ({
        title: source.title,
        url: source.url,
        snippet: "Source reference",
        score: 0.9 - index * 0.01,
        source_provider: this.name,
        metadata: { type: "source", favicon: source.favicon }
      }))
    );
    return results;
  }
};

// src/providers/enhancement/kagi-enrichment/index.ts
var KagiEnrichmentSearchProvider = class {
  name = "kagi_enrichment";
  description = "Search specialized indexes (Teclis for web, TinyGem for news). Ideal for discovering non-mainstream results and supplementary knowledge.";
  async search(params) {
    const api_key = validate_api_key(
      config.enhancement.kagi_enrichment.api_key,
      this.name
    );
    const query = sanitize_query(params.query);
    const limit = params.limit ?? 5;
    const enrich_request = async () => {
      try {
        const [webData, newsData] = await Promise.all([
          http_json(
            this.name,
            `https://kagi.com/api/v0/enrich/web?${new URLSearchParams(
              {
                q: query,
                limit: String(limit)
              }
            )}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bot ${api_key}`,
                Accept: "application/json"
              },
              signal: AbortSignal.timeout(
                config.enhancement.kagi_enrichment.timeout
              )
            }
          ),
          http_json(
            this.name,
            `https://kagi.com/api/v0/enrich/news?${new URLSearchParams(
              {
                q: query,
                limit: String(limit)
              }
            )}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bot ${api_key}`,
                Accept: "application/json"
              },
              signal: AbortSignal.timeout(
                config.enhancement.kagi_enrichment.timeout
              )
            }
          )
        ]);
        if (!webData?.data || !newsData?.data) {
          throw new ProviderError(
            "API_ERROR" /* API_ERROR */,
            "Unexpected response: missing data from enrichment endpoints",
            this.name
          );
        }
        const allData = [...webData.data, ...newsData.data];
        return allData.flatMap((result) => {
          if (!result.title || !result.url) return [];
          return [
            {
              title: result.title,
              url: result.url,
              snippet: (result.snippet ?? "").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
              score: result.rank ? 1 / result.rank : void 0,
              source_provider: this.name
            }
          ];
        });
      } catch (error) {
        handle_provider_error(error, this.name, "enrich content");
      }
    };
    return retry_with_backoff(enrich_request);
  }
};

// src/providers/processing/exa-contents/index.ts
var exa_contents_response_schema = object({
  results: array(
    object({
      id: string(),
      title: string(),
      url: string(),
      text: optional(string()),
      highlights: optional(array(string())),
      summary: optional(string()),
      publishedDate: optional(string()),
      author: optional(string())
    })
  ),
  requestId: string()
});
var ExaContentsProvider = class {
  name = "exa_contents";
  description = "Extract full content from Exa search result IDs";
  async process_content(idsOrUrls, extract_depth = "basic") {
    const api_key = validate_api_key(
      config.processing.exa_contents.api_key,
      this.name
    );
    const items = Array.isArray(idsOrUrls) ? idsOrUrls : [idsOrUrls];
    if (items.length === 0) {
      throw new ProviderError(
        "INVALID_INPUT" /* INVALID_INPUT */,
        "At least one ID must be provided",
        this.name
      );
    }
    const process_request = async () => {
      try {
        const looksLikeUrl = (value) => {
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        };
        const allAreUrls = items.every(looksLikeUrl);
        const request_body = {
          ...allAreUrls ? { urls: items } : { ids: items },
          text: true,
          highlights: extract_depth === "advanced",
          summary: extract_depth === "advanced"
        };
        const raw_data = await http_json(
          this.name,
          `${config.processing.exa_contents.base_url}/contents`,
          {
            method: "POST",
            headers: {
              "x-api-key": api_key,
              Authorization: `Bearer ${api_key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(request_body)
          }
        );
        const data = parse_provider_response(
          this.name,
          exa_contents_response_schema,
          raw_data
        );
        let combined_content = "";
        const raw_contents = [];
        let total_word_count = 0;
        for (const result of data.results) {
          const content = result.text || result.summary || "No content available";
          const word_count = content.split(/\s+/).length;
          total_word_count += word_count;
          combined_content += `## ${result.title}

`;
          if (result.author) {
            combined_content += `**Author:** ${result.author}
`;
          }
          if (result.publishedDate) {
            combined_content += `**Published:** ${result.publishedDate}
`;
          }
          combined_content += `**URL:** ${result.url}

`;
          if (result.highlights && result.highlights.length > 0) {
            combined_content += `**Key Highlights:**
`;
            for (const highlight of result.highlights) {
              combined_content += `- ${highlight}
`;
            }
            combined_content += "\n";
          }
          if (result.summary && result.text) {
            combined_content += `**Summary:** ${result.summary}

`;
            combined_content += `**Full Content:**
${result.text}

`;
          } else {
            combined_content += `${content}

`;
          }
          combined_content += "---\n\n";
          raw_contents.push({
            url: result.url,
            content
          });
        }
        return {
          content: combined_content,
          raw_contents,
          metadata: {
            title: `Content from ${data.results.length} Exa results`,
            word_count: total_word_count,
            urls_processed: data.results.length,
            successful_extractions: data.results.length,
            extract_depth,
            requestId: data.requestId
          },
          source_provider: this.name
        };
      } catch (error) {
        handle_provider_error(error, this.name, "extract contents");
      }
    };
    return retry_with_backoff(process_request);
  }
};

// src/providers/processing/exa-similar/index.ts
var exa_similar_response_schema = object({
  results: array(
    object({
      id: string(),
      title: string(),
      url: string(),
      text: optional(string()),
      highlights: optional(array(string())),
      summary: optional(string()),
      publishedDate: optional(string()),
      author: optional(string()),
      score: optional(number())
    })
  ),
  requestId: string()
});
var ExaSimilarProvider = class {
  name = "exa_similar";
  description = "Find web pages semantically similar to a given URL using Exa";
  async process_content(url2, extract_depth = "basic") {
    const api_key = validate_api_key(
      config.processing.exa_similar.api_key,
      this.name
    );
    const target_url = Array.isArray(url2) ? url2[0] : url2;
    if (!target_url) {
      throw new ProviderError(
        "INVALID_INPUT" /* INVALID_INPUT */,
        "A URL must be provided",
        this.name
      );
    }
    validate_processing_urls(target_url, this.name);
    const process_request = async () => {
      try {
        const request_body = {
          url: target_url,
          numResults: extract_depth === "advanced" ? 15 : 10,
          contents: {
            text: {
              maxCharacters: extract_depth === "advanced" ? 3e3 : 1500
            },
            highlights: extract_depth === "advanced",
            summary: extract_depth === "advanced"
          }
        };
        const raw_data = await http_json(
          this.name,
          `${config.processing.exa_similar.base_url}/findSimilar`,
          {
            method: "POST",
            headers: {
              "x-api-key": api_key,
              Authorization: `Bearer ${api_key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(request_body)
          }
        );
        const data = parse_provider_response(
          this.name,
          exa_similar_response_schema,
          raw_data
        );
        let combined_content = `# Similar Pages to ${target_url}

`;
        combined_content += `Found ${data.results.length} similar pages:

`;
        const raw_contents = [];
        let total_word_count = 0;
        for (const result of data.results) {
          const content = result.text || result.summary || "No content available";
          const word_count = content.split(/\s+/).length;
          total_word_count += word_count;
          combined_content += `## ${result.title}

`;
          if (result.author) {
            combined_content += `**Author:** ${result.author}
`;
          }
          if (result.publishedDate) {
            combined_content += `**Published:** ${result.publishedDate}
`;
          }
          if (result.score) {
            combined_content += `**Similarity Score:** ${result.score.toFixed(
              3
            )}
`;
          }
          combined_content += `**URL:** ${result.url}

`;
          if (result.highlights && result.highlights.length > 0) {
            combined_content += `**Key Highlights:**
`;
            for (const highlight of result.highlights) {
              combined_content += `- ${highlight}
`;
            }
            combined_content += "\n";
          }
          if (result.summary && result.text) {
            combined_content += `**Summary:** ${result.summary}

`;
            combined_content += `**Content Preview:**
${result.text.substring(
              0,
              500
            )}${result.text.length > 500 ? "..." : ""}

`;
          } else {
            combined_content += `${content.substring(0, 500)}${content.length > 500 ? "..." : ""}

`;
          }
          combined_content += "---\n\n";
          raw_contents.push({
            url: result.url,
            content
          });
        }
        return {
          content: combined_content,
          raw_contents,
          metadata: {
            title: `Similar pages to ${target_url}`,
            word_count: total_word_count,
            urls_processed: data.results.length,
            successful_extractions: data.results.length,
            extract_depth,
            original_url: target_url,
            requestId: data.requestId
          },
          source_provider: this.name
        };
      } catch (error) {
        handle_provider_error(error, this.name, "find similar pages");
      }
    };
    return retry_with_backoff(process_request);
  }
};

// src/common/firecrawl-utils.ts
var make_firecrawl_request = async (provider_name, base_url, api_key, body, timeout, schema) => {
  const data = await http_json(provider_name, base_url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${api_key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout)
  });
  return parse_provider_response(provider_name, schema, data);
};
var validate_firecrawl_response = (data, provider_name, error_message) => {
  if (!data.success || data.error) {
    throw new ProviderError(
      "PROVIDER_ERROR" /* PROVIDER_ERROR */,
      `${error_message}: ${data.error || "Unknown error"}`,
      provider_name
    );
  }
};
var poll_firecrawl_job = async (config2, schema) => {
  let attempts = 0;
  while (attempts < config2.max_attempts) {
    attempts++;
    await new Promise(
      (resolve) => setTimeout(resolve, config2.poll_interval)
    );
    let status_result;
    try {
      const raw_status_result = await http_json(
        config2.provider_name,
        config2.status_url,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${config2.api_key}`
          },
          signal: AbortSignal.timeout(config2.timeout)
        }
      );
      status_result = parse_provider_response(
        config2.provider_name,
        schema,
        raw_status_result
      );
    } catch (error) {
      if (error instanceof ProviderError && error.details?.retryable === false) {
        throw error;
      }
      continue;
    }
    if (status_result.success === false) {
      throw new ProviderError(
        "PROVIDER_ERROR" /* PROVIDER_ERROR */,
        `Error checking job status: ${status_result.error || "Unknown error"}`,
        config2.provider_name
      );
    }
    if (status_result.status === "completed" && status_result.data) {
      return status_result;
    }
    if (status_result.status === "error" || status_result.status === "failed" || status_result.status === "cancelled") {
      throw new ProviderError(
        "PROVIDER_ERROR" /* PROVIDER_ERROR */,
        `Job failed: ${status_result.error || "Unknown error"}`,
        config2.provider_name
      );
    }
  }
  throw new ProviderError(
    "TIMEOUT" /* TIMEOUT */,
    "Job timed out - try again later or with a smaller scope",
    config2.provider_name,
    { retryable: true }
  );
};

// src/providers/processing/firecrawl-actions/index.ts
var firecrawl_metadata_schema = record(string(), unknown());
var firecrawl_actions_response_schema = object({
  success: boolean(),
  data: optional(
    object({
      markdown: optional(string()),
      html: optional(nullable(string())),
      rawHtml: optional(nullable(string())),
      screenshot: optional(nullable(string())),
      actions: optional(
        object({
          screenshots: optional(array(string()))
        })
      ),
      metadata: optional(firecrawl_metadata_schema)
    })
  ),
  error: optional(string())
});
var FirecrawlActionsProvider = class {
  name = "firecrawl_actions";
  description = "Support for page interactions (clicking, scrolling, etc.) before extraction for dynamic content using Firecrawl. Enables extraction from JavaScript-heavy sites, single-page applications, and content behind user interactions. Best for accessing content that requires navigation, form filling, or other interactions.";
  async process_content(url2, extract_depth = "basic") {
    const urls = validate_processing_urls(url2, this.name);
    const actions_url = urls[0];
    const actions_request = async () => {
      const api_key = validate_api_key(
        config.processing.firecrawl_actions.api_key,
        this.name
      );
      try {
        const actions = extract_depth === "advanced" ? [
          { type: "wait", milliseconds: 2e3 },
          { type: "scroll", direction: "down" },
          { type: "wait", milliseconds: 1e3 },
          { type: "scroll", direction: "down" },
          { type: "wait", milliseconds: 1e3 },
          {
            type: "click",
            selector: 'button:contains("Read more"), button:contains("Show more"), a:contains("Read more"), a:contains("Show more")'
          },
          { type: "wait", milliseconds: 2e3 }
        ] : [
          { type: "wait", milliseconds: 2e3 },
          { type: "scroll", direction: "down" },
          { type: "wait", milliseconds: 1e3 }
        ];
        const actions_data = await make_firecrawl_request(
          this.name,
          config.processing.firecrawl_actions.base_url,
          api_key,
          {
            url: actions_url,
            formats: ["markdown", "screenshot"],
            actions
          },
          config.processing.firecrawl_actions.timeout,
          firecrawl_actions_response_schema
        );
        validate_firecrawl_response(
          actions_data,
          this.name,
          "Error performing actions"
        );
        if (!actions_data.data) {
          throw new ProviderError(
            "PROVIDER_ERROR" /* PROVIDER_ERROR */,
            "No data returned from API",
            this.name
          );
        }
        if (!actions_data.data.markdown && !actions_data.data.html && !actions_data.data.rawHtml) {
          throw new ProviderError(
            "PROVIDER_ERROR" /* PROVIDER_ERROR */,
            "No content extracted after performing actions",
            this.name
          );
        }
        const content = actions_data.data.markdown || actions_data.data.html || actions_data.data.rawHtml || "";
        const actions_description = `# Content from ${actions_url} after interactions

The following actions were performed before extraction:

` + actions.map((action, index) => {
          switch (action.type) {
            case "click":
              return `${index + 1}. Click on ${action.selector || `coordinates (${action.x}, ${action.y})`}`;
            case "write":
              return `${index + 1}. Write "${action.text}" ${action.selector ? `into ${action.selector}` : ""}`;
            case "scroll":
              return `${index + 1}. Scroll ${action.direction || "down"}`;
            case "wait":
              return `${index + 1}. Wait ${action.milliseconds ? `for ${action.milliseconds}ms` : ""}`;
            case "executeJavascript":
              return `${index + 1}. Execute JavaScript`;
            case "screenshot":
              return `${index + 1}. Take screenshot`;
            default:
              return `${index + 1}. Perform ${String(action.type)} action`;
          }
        }).join("\n") + "\n\n---\n\n" + content;
        const raw_contents = [
          {
            url: actions_url,
            content: actions_description
          }
        ];
        const word_count = actions_description.split(/\s+/).filter(Boolean).length;
        return {
          content: actions_description,
          raw_contents,
          metadata: {
            title: `Content from ${actions_url} after interactions`,
            word_count,
            urls_processed: 1,
            successful_extractions: 1,
            extract_depth,
            screenshot: actions_data.data.screenshot
          },
          source_provider: this.name
        };
      } catch (error) {
        handle_provider_error(error, this.name, "perform actions");
      }
    };
    return retry_with_backoff(actions_request);
  }
};

// src/providers/processing/firecrawl-crawl/index.ts
var firecrawl_metadata_schema2 = record(string(), unknown());
var firecrawl_crawl_response_schema = object({
  success: boolean(),
  id: string(),
  url: string(),
  error: optional(string())
});
var firecrawl_crawl_status_response_schema = object({
  status: string(),
  total: optional(number()),
  completed: optional(number()),
  data: optional(
    array(
      object({
        url: optional(string()),
        markdown: optional(string()),
        html: optional(nullable(string())),
        rawHtml: optional(nullable(string())),
        metadata: optional(firecrawl_metadata_schema2),
        error: optional(nullable(string()))
      })
    )
  ),
  error: optional(string())
});
var get_firecrawl_page_url = (page, fallback_url) => {
  const metadata_url = page.metadata?.sourceURL ?? page.metadata?.url;
  return page.url ?? (typeof metadata_url === "string" ? metadata_url : fallback_url);
};
var get_firecrawl_page_error = (page) => {
  const metadata_error = page.metadata?.error;
  return page.error ?? (typeof metadata_error === "string" ? metadata_error : void 0);
};
var FirecrawlCrawlProvider = class {
  name = "firecrawl_crawl";
  description = "Deep crawling of all accessible subpages on a website with configurable depth limits using Firecrawl. Efficiently discovers and extracts content from multiple pages within a domain. Best for comprehensive site analysis, content indexing, and data collection from entire websites.";
  async process_content(url2, extract_depth = "basic") {
    const urls = validate_processing_urls(url2, this.name);
    const crawl_url = urls[0];
    const crawl_request = async () => {
      const api_key = validate_api_key(
        config.processing.firecrawl_crawl.api_key,
        this.name
      );
      try {
        const crawl_data = await make_firecrawl_request(
          this.name,
          config.processing.firecrawl_crawl.base_url,
          api_key,
          {
            url: crawl_url,
            scrapeOptions: {
              formats: ["markdown"],
              onlyMainContent: true
            },
            maxDiscoveryDepth: extract_depth === "advanced" ? 3 : 1,
            limit: extract_depth === "advanced" ? 50 : 20
          },
          config.processing.firecrawl_crawl.timeout,
          firecrawl_crawl_response_schema
        );
        validate_firecrawl_response(
          crawl_data,
          this.name,
          "Error starting crawl"
        );
        const status_data = await poll_firecrawl_job(
          {
            provider_name: this.name,
            status_url: `${config.processing.firecrawl_crawl.base_url}/${crawl_data.id}`,
            api_key,
            max_attempts: 20,
            poll_interval: 5e3,
            timeout: 3e4
          },
          firecrawl_crawl_status_response_schema
        );
        if (!status_data.data || status_data.data.length === 0) {
          throw new ProviderError(
            "PROVIDER_ERROR" /* PROVIDER_ERROR */,
            "Crawl returned no data",
            this.name
          );
        }
        const successful_pages = status_data.data.filter(
          (page) => !get_firecrawl_page_error(page) && (page.markdown || page.html || page.rawHtml)
        );
        if (successful_pages.length === 0) {
          throw new ProviderError(
            "PROVIDER_ERROR" /* PROVIDER_ERROR */,
            "All crawled pages failed to extract content",
            this.name
          );
        }
        const raw_contents = successful_pages.map((page) => ({
          url: get_firecrawl_page_url(page, crawl_url),
          content: page.markdown || page.html || page.rawHtml || ""
        }));
        const combined_content = raw_contents.map(
          (result) => `# ${result.url}

${result.content}

---

`
        ).join("\n\n");
        const word_count = combined_content.split(/\s+/).filter(Boolean).length;
        const title_value = successful_pages[0]?.metadata?.title;
        const title = typeof title_value === "string" ? title_value : void 0;
        const failed_urls = status_data.data.filter((page) => get_firecrawl_page_error(page)).map((page) => get_firecrawl_page_url(page, crawl_url));
        return {
          content: combined_content,
          raw_contents,
          metadata: {
            title,
            word_count,
            failed_urls: failed_urls.length > 0 ? failed_urls : void 0,
            urls_processed: status_data.data.length,
            successful_extractions: successful_pages.length,
            extract_depth
          },
          source_provider: this.name
        };
      } catch (error) {
        handle_provider_error(error, this.name, "crawl website");
      }
    };
    return retry_with_backoff(crawl_request);
  }
};

// src/providers/processing/firecrawl-extract/index.ts
var firecrawl_extract_response_schema = object({
  success: boolean(),
  id: string(),
  error: optional(string())
});
var firecrawl_extract_status_response_schema = object({
  success: boolean(),
  id: string(),
  status: string(),
  data: optional(record(string(), unknown())),
  error: optional(string())
});
var FirecrawlExtractProvider = class {
  name = "firecrawl_extract";
  description = "Structured data extraction with AI using natural language prompts via Firecrawl. Extracts specific information from web pages based on custom extraction instructions. Best for targeted data collection, information extraction, and converting unstructured web content into structured data.";
  async process_content(url2, extract_depth = "basic") {
    const urls = validate_processing_urls(url2, this.name);
    const extract_url = urls[0];
    const extract_request = async () => {
      const api_key = validate_api_key(
        config.processing.firecrawl_extract.api_key,
        this.name
      );
      try {
        const extraction_prompt = extract_depth === "advanced" ? "Extract all relevant information from this page including: title, author, date published, main content, categories or tags, related links, and any structured data like product information, pricing, or specifications. Format the data in a well-structured way." : "Extract the main content, title, and author from this page. Summarize the key information.";
        const extract_data = await make_firecrawl_request(
          this.name,
          config.processing.firecrawl_extract.base_url,
          api_key,
          {
            urls: [extract_url],
            prompt: extraction_prompt,
            showSources: true,
            scrapeOptions: {
              formats: ["markdown"],
              onlyMainContent: true,
              waitFor: extract_depth === "advanced" ? 5e3 : 2e3
            }
          },
          config.processing.firecrawl_extract.timeout,
          firecrawl_extract_response_schema
        );
        validate_firecrawl_response(
          extract_data,
          this.name,
          "Error starting extraction"
        );
        const status_data = await poll_firecrawl_job(
          {
            provider_name: this.name,
            status_url: `${config.processing.firecrawl_extract.base_url}/${extract_data.id}`,
            api_key,
            max_attempts: 15,
            poll_interval: 3e3,
            timeout: 3e4
          },
          firecrawl_extract_status_response_schema
        );
        if (!status_data.data) {
          throw new ProviderError(
            "PROVIDER_ERROR" /* PROVIDER_ERROR */,
            "No data extracted from URL",
            this.name
          );
        }
        let formatted_content = `# Extracted Data from ${extract_url}

`;
        for (const [key, value] of Object.entries(status_data.data)) {
          if (typeof value === "string") {
            formatted_content += `## ${key.charAt(0).toUpperCase() + key.slice(1)}

${value}

`;
          } else if (Array.isArray(value)) {
            formatted_content += `## ${key.charAt(0).toUpperCase() + key.slice(1)}

`;
            value.forEach((item, index) => {
              if (typeof item === "object") {
                formatted_content += `### Item ${index + 1}

`;
                for (const [itemKey, itemValue] of Object.entries(
                  item
                )) {
                  formatted_content += `- **${itemKey}**: ${String(itemValue)}
`;
                }
                formatted_content += "\n";
              } else {
                formatted_content += `- ${item}
`;
              }
            });
            formatted_content += "\n";
          } else if (typeof value === "object" && value !== null) {
            formatted_content += `## ${key.charAt(0).toUpperCase() + key.slice(1)}

`;
            for (const [subKey, subValue] of Object.entries(value)) {
              formatted_content += `- **${subKey}**: ${subValue}
`;
            }
            formatted_content += "\n";
          }
        }
        const raw_contents = [
          {
            url: extract_url,
            content: formatted_content
          }
        ];
        const title = typeof status_data.data.title === "string" ? status_data.data.title : `Extracted Data from ${extract_url}`;
        const word_count = formatted_content.split(/\s+/).filter(Boolean).length;
        return {
          content: formatted_content,
          raw_contents,
          metadata: {
            title,
            word_count,
            urls_processed: 1,
            successful_extractions: 1,
            extract_depth
          },
          source_provider: this.name
        };
      } catch (error) {
        handle_provider_error(error, this.name, "extract data");
      }
    };
    return retry_with_backoff(extract_request);
  }
};

// src/providers/processing/firecrawl-map/index.ts
var firecrawl_map_response_schema = object({
  success: boolean(),
  links: optional(
    array(
      object({
        url: string(),
        title: optional(string())
      })
    )
  ),
  error: optional(string())
});
var FirecrawlMapProvider = class {
  name = "firecrawl_map";
  description = "Fast URL collection from websites for comprehensive site mapping using Firecrawl. Efficiently discovers all accessible URLs within a domain without extracting content. Best for site auditing, URL discovery, and preparing for targeted content extraction.";
  async process_content(url2, extract_depth = "basic") {
    const urls = validate_processing_urls(url2, this.name);
    const map_url = urls[0];
    const map_request = async () => {
      const api_key = validate_api_key(
        config.processing.firecrawl_map.api_key,
        this.name
      );
      try {
        const map_data = await make_firecrawl_request(
          this.name,
          config.processing.firecrawl_map.base_url,
          api_key,
          {
            url: map_url,
            limit: extract_depth === "advanced" ? 200 : 50,
            includeSubdomains: false
          },
          config.processing.firecrawl_map.timeout,
          firecrawl_map_response_schema
        );
        validate_firecrawl_response(
          map_data,
          this.name,
          "Error mapping website"
        );
        if (!map_data.links || map_data.links.length === 0) {
          throw new ProviderError(
            "PROVIDER_ERROR" /* PROVIDER_ERROR */,
            "No URLs discovered during mapping",
            this.name
          );
        }
        const formatted_content = `# Site Map for ${map_url}

Found ${map_data.links.length} URLs:

` + map_data.links.map(
          (link) => link.title ? `- ${link.url} \u2014 ${link.title}` : `- ${link.url}`
        ).join("\n");
        const raw_contents = [
          {
            url: map_url,
            content: formatted_content
          }
        ];
        return {
          content: formatted_content,
          raw_contents,
          metadata: {
            title: `Site Map for ${map_url}`,
            word_count: map_data.links.length,
            // Count URLs as "words"
            urls_processed: 1,
            // We only processed the starting URL
            successful_extractions: 1,
            extract_depth
          },
          source_provider: this.name
        };
      } catch (error) {
        handle_provider_error(error, this.name, "map website");
      }
    };
    return retry_with_backoff(map_request);
  }
};

// src/common/results.ts
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
var CHARS_PER_TOKEN = 4;
var MAX_SAFE_TOKENS = 2e4;
var MAX_SAFE_CHARS = MAX_SAFE_TOKENS * CHARS_PER_TOKEN;
var get_large_result_mode = (mode_override) => {
  if (mode_override) return mode_override;
  const configured_mode = process.env.OMNISEARCH_LARGE_RESULT_MODE;
  if (configured_mode === "inline" || configured_mode === "file") {
    return configured_mode;
  }
  return "file";
};
var format_as_text = (result) => {
  const lines = [];
  const sections = [];
  let current_line = 1;
  const add_line = (line) => {
    if (line.startsWith("URL: ")) {
      sections.push({ title: line, line: current_line });
    } else if (line.startsWith("# ")) {
      sections.push({
        title: line.slice(2),
        line: current_line
      });
    } else if (line.startsWith("## ")) {
      sections.push({
        title: line.slice(3),
        line: current_line
      });
    } else if (line.startsWith("### ")) {
      sections.push({
        title: line.slice(4),
        line: current_line
      });
    }
    lines.push(line);
    current_line++;
  };
  const add_content = (content) => {
    const content_lines = content.split("\n");
    for (const line of content_lines) {
      add_line(line);
    }
  };
  const raw_contents = result.raw_contents;
  if (raw_contents?.length) {
    for (const item of raw_contents) {
      add_line("=".repeat(80));
      add_line(`URL: ${item.url}`);
      add_line("=".repeat(80));
      if (item.content) {
        add_content(item.content);
      }
      add_line("");
    }
  } else if (result.content) {
    add_content(JSON.stringify(result.content));
  } else {
    add_content(JSON.stringify(result, null, 2));
  }
  if (result.metadata) {
    add_line("");
    add_line("=".repeat(80));
    sections.push({ title: "METADATA", line: current_line });
    add_line("METADATA");
    add_line("=".repeat(80));
    add_content(JSON.stringify(result.metadata, null, 2));
  }
  return {
    text: lines.join("\n"),
    sections,
    total_lines: current_line - 1
  };
};
var handle_large_result = (result, provider_name, options = {}) => {
  const json = JSON.stringify(result, null, 2);
  const char_count = json.length;
  if (char_count <= MAX_SAFE_CHARS) {
    return result;
  }
  if (get_large_result_mode(options.mode) === "inline") {
    return result;
  }
  const file_id = randomUUID();
  const file_path = join(
    tmpdir(),
    `mcp-${provider_name}-${file_id}.txt`
  );
  const { text, sections, total_lines } = format_as_text(
    result
  );
  writeFileSync(file_path, text, "utf-8");
  const result_obj = result;
  const metadata = result_obj.metadata;
  const word_count = metadata?.word_count ?? "unknown";
  const urls_processed = metadata?.urls_processed ?? "unknown";
  return {
    file_path,
    total_lines,
    estimated_tokens: Math.round(char_count / CHARS_PER_TOKEN),
    sections,
    read_hint: `Use Read tool with file_path="${file_path}" and offset=LINE_NUMBER limit=50 to read a section`,
    metadata: {
      word_count,
      urls_processed,
      source_provider: result_obj.source_provider
    }
  };
};
var omit_raw_contents = (result) => {
  const { raw_contents: _raw_contents, ...compact_result } = result;
  return compact_result;
};
var aggregate_url_results = (results, provider_name, urls, extract_depth) => {
  const successful_results = results.filter((r) => r.success);
  const failed_urls = results.filter((r) => !r.success).map((r) => r.url);
  if (successful_results.length === 0) {
    throw new ProviderError(
      "PROVIDER_ERROR" /* PROVIDER_ERROR */,
      "Failed to extract content from all URLs",
      provider_name
    );
  }
  const raw_contents = successful_results.map((result) => ({
    url: result.url,
    content: result.content
  }));
  const combined_content = raw_contents.map((result) => result.content).join("\n\n");
  const word_count = combined_content.split(/\s+/).filter(Boolean).length;
  const title = successful_results[0]?.metadata?.title;
  return {
    content: combined_content,
    raw_contents,
    metadata: {
      title,
      word_count,
      failed_urls: failed_urls.length > 0 ? failed_urls : void 0,
      urls_processed: urls.length,
      successful_extractions: successful_results.length,
      extract_depth
    },
    source_provider: provider_name
  };
};

// src/providers/processing/firecrawl-scrape/index.ts
var firecrawl_metadata_schema3 = record(string(), unknown());
var firecrawl_scrape_response_schema = object({
  success: boolean(),
  data: optional(
    object({
      markdown: optional(string()),
      html: optional(nullable(string())),
      rawHtml: optional(nullable(string())),
      screenshot: optional(nullable(string())),
      links: optional(array(string())),
      metadata: optional(firecrawl_metadata_schema3),
      llm_extraction: optional(unknown()),
      warning: optional(string())
    })
  ),
  error: optional(string())
});
var FirecrawlScrapeProvider = class {
  name = "firecrawl_scrape";
  description = "Extract clean, LLM-ready data from single URLs with enhanced formatting options using Firecrawl. Efficiently converts web content into markdown, plain text, or structured data with configurable extraction options. Best for content analysis, data collection, and AI training data preparation.";
  async process_content(url2, extract_depth = "basic") {
    const urls = validate_processing_urls(url2, this.name);
    const scrape_request = async () => {
      const api_key = validate_api_key(
        config.processing.firecrawl_scrape.api_key,
        this.name
      );
      try {
        const results = await Promise.all(
          urls.map(async (single_url) => {
            try {
              const data = await make_firecrawl_request(
                this.name,
                config.processing.firecrawl_scrape.base_url,
                api_key,
                {
                  url: single_url,
                  formats: ["markdown"],
                  onlyMainContent: true,
                  waitFor: extract_depth === "advanced" ? 5e3 : 2e3
                },
                config.processing.firecrawl_scrape.timeout,
                firecrawl_scrape_response_schema
              );
              validate_firecrawl_response(
                data,
                this.name,
                "Error scraping URL"
              );
              if (!data.data) {
                throw new ProviderError(
                  "PROVIDER_ERROR" /* PROVIDER_ERROR */,
                  "No data returned from API",
                  this.name
                );
              }
              if (!data.data.markdown && !data.data.html && !data.data.rawHtml) {
                throw new ProviderError(
                  "PROVIDER_ERROR" /* PROVIDER_ERROR */,
                  "No content extracted from URL",
                  this.name
                );
              }
              const content = data.data.markdown || data.data.html || data.data.rawHtml || "";
              return {
                url: single_url,
                content,
                metadata: data.data.metadata,
                success: true
              };
            } catch (error) {
              console.error(`Error processing ${single_url}:`, error);
              return {
                url: single_url,
                content: "",
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
              };
            }
          })
        );
        return aggregate_url_results(
          results,
          this.name,
          urls,
          extract_depth
        );
      } catch (error) {
        handle_provider_error(error, this.name, "extract content");
      }
    };
    return retry_with_backoff(scrape_request);
  }
};

// src/providers/processing/kagi-summarizer/index.ts
var kagi_summarizer_response_schema = object({
  meta: object({
    id: string(),
    node: string(),
    ms: number(),
    api_balance: optional(number())
  }),
  data: object({
    output: string(),
    tokens: number()
  })
});
var KagiSummarizerProvider = class {
  name = "kagi_summarizer";
  description = "Instantly summarizes content of any type and length from URLs. Supports pages, videos, and podcasts with transcripts. Best for quick comprehension of long-form content and multimedia resources.";
  async process_content(url2) {
    const api_key = validate_api_key(
      config.processing.kagi_summarizer.api_key,
      this.name
    );
    const summarize_request = async () => {
      try {
        const raw_data = await http_json(
          this.name,
          config.processing.kagi_summarizer.base_url,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bot ${api_key}`
            },
            body: JSON.stringify({ url: url2 }),
            signal: AbortSignal.timeout(
              config.processing.kagi_summarizer.timeout
            )
          }
        );
        const data = parse_provider_response(
          this.name,
          kagi_summarizer_response_schema,
          raw_data
        );
        return {
          content: data.data.output,
          metadata: {
            word_count: data.data.tokens
          },
          source_provider: this.name
        };
      } catch (error) {
        handle_provider_error(error, this.name, "fetch summary");
      }
    };
    return retry_with_backoff(summarize_request);
  }
};

// src/providers/processing/tavily-crawl/index.ts
var tavily_crawl_response_schema = object({
  base_url: string(),
  results: array(
    object({
      url: string(),
      raw_content: nullable(string()),
      favicon: optional(nullable(string()))
    })
  ),
  response_time: union([number(), string()]),
  request_id: optional(string()),
  usage: optional(
    object({
      credits: number()
    })
  )
});
var TavilyCrawlProvider = class {
  name = "tavily_crawl";
  description = "Crawl a website with Tavily graph-based discovery and content extraction. Best for documentation indexing and multi-page site analysis.";
  async process_content(url2, extract_depth = "basic") {
    const [crawl_url] = validate_processing_urls(url2, this.name);
    const crawl_request = async () => {
      const api_key = validate_api_key(
        config.processing.tavily_crawl.api_key,
        this.name
      );
      try {
        const raw_data = await http_json(
          this.name,
          `${config.processing.tavily_crawl.base_url}/crawl`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${api_key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              url: crawl_url,
              max_depth: extract_depth === "advanced" ? 3 : 1,
              max_breadth: extract_depth === "advanced" ? 50 : 20,
              limit: extract_depth === "advanced" ? 50 : 20,
              extract_depth,
              format: "markdown",
              include_favicon: true,
              include_usage: true
            }),
            signal: AbortSignal.timeout(
              config.processing.tavily_crawl.timeout
            )
          }
        );
        const data = parse_provider_response(
          this.name,
          tavily_crawl_response_schema,
          raw_data
        );
        const successful_results = data.results.filter(
          (result) => typeof result.raw_content === "string" && result.raw_content.length > 0
        );
        if (successful_results.length === 0) {
          throw new ProviderError(
            "PROVIDER_ERROR" /* PROVIDER_ERROR */,
            "Crawl returned no content",
            this.name
          );
        }
        const raw_contents = successful_results.map((result) => ({
          url: result.url,
          content: result.raw_content
        }));
        const content = raw_contents.map((result) => `# ${result.url}

${result.content}`).join("\n\n---\n\n");
        const favicons = Object.fromEntries(
          successful_results.filter((result) => result.favicon).map((result) => [result.url, result.favicon])
        );
        const failed_urls = data.results.filter((result) => !result.raw_content).map((result) => result.url);
        return {
          content,
          raw_contents,
          metadata: {
            word_count: content.split(/\s+/).filter(Boolean).length,
            urls_processed: data.results.length,
            successful_extractions: successful_results.length,
            failed_urls: failed_urls.length > 0 ? failed_urls : void 0,
            extract_depth,
            response_time: data.response_time,
            ...data.request_id ? { request_id: data.request_id } : {},
            ...data.usage ? { usage: data.usage } : {},
            ...Object.keys(favicons).length > 0 ? { favicons } : {}
          },
          source_provider: this.name
        };
      } catch (error) {
        handle_provider_error(error, this.name, "crawl website");
      }
    };
    return retry_with_backoff(crawl_request);
  }
};

// src/providers/processing/tavily-extract/index.ts
var tavily_extract_response_schema = object({
  results: array(
    object({
      url: string(),
      raw_content: string(),
      images: optional(array(string())),
      favicon: optional(string())
    })
  ),
  failed_results: array(
    object({
      url: string(),
      error: string()
    })
  ),
  response_time: union([number(), string()]),
  request_id: optional(string()),
  usage: optional(
    object({
      credits: number()
    })
  )
});
var TavilyExtractProvider = class {
  name = "tavily_extract";
  description = "Extract web page content from single or multiple URLs using Tavily Extract. Efficiently converts web content into clean, processable text with configurable extraction depth and optional image extraction. Returns both combined and individual URL content. Best for content analysis, data collection, and research.";
  async process_content(url2, extract_depth = "basic", options = {}) {
    const urls = validate_processing_urls(url2, this.name);
    if (options.chunks_per_source !== void 0 && !options.query) {
      throw new ProviderError(
        "INVALID_INPUT" /* INVALID_INPUT */,
        "query is required when chunks_per_source is provided",
        this.name
      );
    }
    const extract_request = async () => {
      const api_key = validate_api_key(
        config.processing.tavily_extract.api_key,
        this.name
      );
      try {
        const request_body = {
          urls,
          include_images: false,
          include_favicon: true,
          include_usage: true,
          extract_depth,
          format: options.format ?? "markdown",
          ...options.query ? { query: sanitize_query(options.query) } : {},
          ...options.chunks_per_source !== void 0 ? { chunks_per_source: options.chunks_per_source } : {}
        };
        const raw_data = await http_json(
          this.name,
          `${config.processing.tavily_extract.base_url}/extract`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${api_key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(request_body),
            signal: AbortSignal.timeout(
              config.processing.tavily_extract.timeout
            )
          }
        );
        const data = parse_provider_response(
          this.name,
          tavily_extract_response_schema,
          raw_data
        );
        if (data.results.length === 0) {
          throw new ProviderError(
            "PROVIDER_ERROR" /* PROVIDER_ERROR */,
            "No content extracted from URL",
            this.name
          );
        }
        const raw_contents = data.results.map((result) => ({
          url: result.url,
          content: result.raw_content
        }));
        const combined_content = raw_contents.map((result) => result.content).join("\n\n");
        const word_count = combined_content.split(/\s+/).filter(Boolean).length;
        const favicons = Object.fromEntries(
          data.results.filter((result) => result.favicon).map((result) => [result.url, result.favicon])
        );
        const failed_urls = data.failed_results.length > 0 ? data.failed_results.map((f) => f.url) : void 0;
        return {
          content: combined_content,
          raw_contents,
          metadata: {
            word_count,
            failed_urls,
            urls_processed: urls.length,
            successful_extractions: data.results.length,
            extract_depth,
            response_time: data.response_time,
            ...data.request_id ? { request_id: data.request_id } : {},
            ...data.usage ? { usage: data.usage } : {},
            ...Object.keys(favicons).length > 0 ? { favicons } : {}
          },
          source_provider: this.name
        };
      } catch (error) {
        handle_provider_error(error, this.name, "extract content");
      }
    };
    return retry_with_backoff(extract_request);
  }
};

// src/providers/processing/tavily-map/index.ts
var tavily_map_response_schema = object({
  base_url: string(),
  results: array(string()),
  response_time: union([number(), string()]),
  request_id: optional(string()),
  usage: optional(
    object({
      credits: number()
    })
  )
});
var TavilyMapProvider = class {
  name = "tavily_map";
  description = "Discover URLs and site structure with Tavily Map. Best for fast site discovery before targeted extraction or crawling.";
  async process_content(url2, extract_depth = "basic") {
    const [map_url] = validate_processing_urls(url2, this.name);
    const map_request = async () => {
      const api_key = validate_api_key(
        config.processing.tavily_map.api_key,
        this.name
      );
      try {
        const raw_data = await http_json(
          this.name,
          `${config.processing.tavily_map.base_url}/map`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${api_key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              url: map_url,
              max_depth: extract_depth === "advanced" ? 3 : 1,
              max_breadth: extract_depth === "advanced" ? 50 : 20,
              limit: extract_depth === "advanced" ? 200 : 50,
              include_usage: true
            }),
            signal: AbortSignal.timeout(
              config.processing.tavily_map.timeout
            )
          }
        );
        const data = parse_provider_response(
          this.name,
          tavily_map_response_schema,
          raw_data
        );
        if (data.results.length === 0) {
          throw new ProviderError(
            "PROVIDER_ERROR" /* PROVIDER_ERROR */,
            "No URLs discovered during mapping",
            this.name
          );
        }
        const content = `# Site Map for ${map_url}

` + data.results.map((result) => `- ${result}`).join("\n");
        return {
          content,
          raw_contents: [{ url: map_url, content }],
          metadata: {
            title: `Site Map for ${map_url}`,
            word_count: data.results.length,
            urls_processed: 1,
            successful_extractions: data.results.length,
            extract_depth,
            response_time: data.response_time,
            ...data.request_id ? { request_id: data.request_id } : {},
            ...data.usage ? { usage: data.usage } : {}
          },
          source_provider: this.name
        };
      } catch (error) {
        handle_provider_error(error, this.name, "map website");
      }
    };
    return retry_with_backoff(map_request);
  }
};

// src/common/search-operators.ts
var operator_patterns = {
  exclude_site: /-site:([^\s]+)/g,
  site: /site:([^\s]+)/g,
  filetype: /filetype:([^\s]+)/g,
  ext: /ext:([^\s]+)/g,
  intitle: /intitle:([^\s]+)/g,
  inurl: /inurl:([^\s]+)/g,
  inbody: /inbody:"?([^"\s]+)"?/g,
  inpage: /inpage:"?([^"\s]+)"?/g,
  language: /(?:lang|language):([^\s]+)/g,
  location: /(?:loc|location):([^\s]+)/g,
  before: /before:(\d{4}(?:-\d{2}(?:-\d{2})?)?)/g,
  after: /after:(\d{4}(?:-\d{2}(?:-\d{2})?)?)/g,
  exact: /"([^"]+)"/g,
  force_include: /\+([^\s]+)/g,
  exclude_term: /-([^\s:]+)(?!\s*site:)/g,
  boolean: /\b(AND|OR|NOT)\b/g
};
var parse_search_operators = (query) => {
  const operators = [];
  let modified_query = query;
  Object.entries(operator_patterns).forEach(([type, pattern]) => {
    modified_query = modified_query.replace(
      pattern,
      (match, value) => {
        operators.push({
          type,
          value,
          original_text: match
        });
        return "";
      }
    );
  });
  const base_query = modified_query.replace(/\s+/g, " ").trim();
  return {
    base_query,
    operators
  };
};
var apply_search_operators = (parsed_query) => {
  const params = {
    query: parsed_query.base_query
  };
  for (const operator of parsed_query.operators) {
    switch (operator.type) {
      case "site":
        params.include_domains = [
          ...params.include_domains || [],
          operator.value
        ];
        break;
      case "exclude_site":
        params.exclude_domains = [
          ...params.exclude_domains || [],
          operator.value
        ];
        break;
      case "filetype":
      case "ext":
        params.file_type = operator.value;
        break;
      case "intitle":
        params.title_filter = operator.value;
        break;
      case "inurl":
        params.url_filter = operator.value;
        break;
      case "inbody":
        params.body_filter = operator.value;
        break;
      case "inpage":
        params.page_filter = operator.value;
        break;
      case "language":
        params.language = operator.value;
        break;
      case "location":
        params.location = operator.value;
        break;
      case "before":
        params.date_before = operator.value;
        break;
      case "after":
        params.date_after = operator.value;
        break;
      case "exact":
        params.exact_phrases = [
          ...params.exact_phrases || [],
          operator.value
        ];
        break;
      case "force_include":
        params.force_include_terms = [
          ...params.force_include_terms || [],
          operator.value
        ];
        break;
      case "exclude_term":
        params.exclude_terms = [
          ...params.exclude_terms || [],
          operator.value
        ];
        break;
      case "boolean":
        if (!params.boolean_operators) {
          params.boolean_operators = [];
        }
        params.boolean_operators.push({
          type: operator.value,
          terms: []
        });
        break;
    }
  }
  return params;
};
var build_query_with_operators = (search_params, additional_include_domains, additional_exclude_domains, options) => {
  let query = search_params.query;
  const filters = [];
  const include_domains = [
    ...additional_include_domains ?? [],
    ...search_params.include_domains ?? []
  ];
  if (include_domains.length) {
    const domain_filter = include_domains.map((domain) => `site:${domain}`).join(" OR ");
    filters.push(domain_filter);
  }
  const exclude_domains = [
    ...additional_exclude_domains ?? [],
    ...search_params.exclude_domains ?? []
  ];
  if (exclude_domains.length) {
    filters.push(
      ...exclude_domains.map((domain) => `-site:${domain}`)
    );
  }
  if (search_params.file_type && !options?.exclude_file_type) {
    filters.push(`filetype:${search_params.file_type}`);
  }
  if (search_params.title_filter) {
    filters.push(`intitle:${search_params.title_filter}`);
  }
  if (search_params.url_filter) {
    filters.push(`inurl:${search_params.url_filter}`);
  }
  if (search_params.body_filter) {
    filters.push(`inbody:${search_params.body_filter}`);
  }
  if (search_params.page_filter) {
    filters.push(`inpage:${search_params.page_filter}`);
  }
  if (search_params.language) {
    filters.push(`lang:${search_params.language}`);
  }
  if (search_params.location) {
    filters.push(`loc:${search_params.location}`);
  }
  if (search_params.date_before && !options?.exclude_dates) {
    filters.push(`before:${search_params.date_before}`);
  }
  if (search_params.date_after && !options?.exclude_dates) {
    filters.push(`after:${search_params.date_after}`);
  }
  if (search_params.exact_phrases?.length) {
    filters.push(
      ...search_params.exact_phrases.map((phrase) => `"${phrase}"`)
    );
  }
  if (search_params.force_include_terms?.length) {
    filters.push(
      ...search_params.force_include_terms.map((term) => `+${term}`)
    );
  }
  if (search_params.exclude_terms?.length) {
    filters.push(
      ...search_params.exclude_terms.map((term) => `-${term}`)
    );
  }
  if (filters.length > 0) {
    query = `${query} ${filters.join(" ")}`;
  }
  return query;
};

// src/providers/search/brave/index.ts
var brave_search_response_schema = object({
  web: optional(
    object({
      results: array(
        object({
          title: string(),
          url: string(),
          description: optional(string())
        })
      )
    })
  )
});
var BraveSearchProvider = class {
  name = "brave";
  description = 'Privacy-focused search with operators: site:, -site:, filetype:/ext:, intitle:, inurl:, inbody:, inpage:, lang:, loc:, before:, after:, +term, -term, "exact". Best for technical content and privacy-sensitive queries.';
  async search(params) {
    const api_key = validate_api_key(
      config.search.brave.api_key,
      this.name
    );
    const parsed_query = parse_search_operators(params.query);
    const search_params = apply_search_operators(parsed_query);
    const search_request = async () => {
      try {
        const query = build_query_with_operators(
          search_params,
          params.include_domains,
          params.exclude_domains
        );
        const query_params = new URLSearchParams({
          q: query,
          count: (params.limit ?? 10).toString()
        });
        const raw_data = await http_json(
          this.name,
          `${config.search.brave.base_url}/web/search?${query_params}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "X-Subscription-Token": api_key
            },
            signal: AbortSignal.timeout(config.search.brave.timeout)
          }
        );
        const data = parse_provider_response(
          this.name,
          brave_search_response_schema,
          raw_data
        );
        return (data.web?.results ?? []).map((result) => ({
          title: result.title,
          url: result.url,
          snippet: result.description ?? "",
          source_provider: this.name
        }));
      } catch (error) {
        handle_provider_error(
          error,
          this.name,
          "fetch search results"
        );
      }
    };
    return retry_with_backoff(search_request);
  }
};

// src/providers/search/exa/index.ts
var exa_search_response_schema = object({
  requestId: string(),
  autopromptString: optional(string()),
  resolvedSearchType: optional(string()),
  searchType: optional(string()),
  results: array(
    object({
      id: string(),
      title: string(),
      url: string(),
      publishedDate: optional(string()),
      author: optional(string()),
      text: optional(string()),
      score: optional(number()),
      highlights: optional(array(string())),
      summary: optional(string())
    })
  )
});
var ExaSearchProvider = class {
  name = "exa";
  description = "AI-powered web search using neural and keyword search. Optimized for AI applications with semantic understanding, content extraction, and research capabilities.";
  async search(params) {
    const api_key = validate_api_key(
      config.search.exa.api_key,
      this.name
    );
    const search_request = async () => {
      try {
        const request_body = {
          query: sanitize_query(params.query),
          type: "auto",
          // Let Exa choose between neural and keyword search
          numResults: params.limit ?? 10,
          contents: {
            text: { maxCharacters: 3e3 }
          }
        };
        if (params.include_domains && params.include_domains.length > 0) {
          request_body.includeDomains = params.include_domains;
        }
        if (params.exclude_domains && params.exclude_domains.length > 0) {
          request_body.excludeDomains = params.exclude_domains;
        }
        const raw_data = await http_json(
          this.name,
          `${config.search.exa.base_url}/search`,
          {
            method: "POST",
            headers: {
              // Exa accepts either x-api-key or Authorization Bearer
              "x-api-key": api_key,
              Authorization: `Bearer ${api_key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(request_body)
          }
        );
        const data = parse_provider_response(
          this.name,
          exa_search_response_schema,
          raw_data
        );
        return data.results.map((result) => ({
          title: result.title,
          url: result.url,
          snippet: result.text || result.summary || "No content available",
          score: result.score || 0,
          source_provider: this.name,
          metadata: {
            id: result.id,
            author: result.author,
            publishedDate: result.publishedDate,
            highlights: result.highlights,
            autopromptString: data.autopromptString,
            resolvedSearchType: data.resolvedSearchType ?? data.searchType
          }
        }));
      } catch (error) {
        handle_provider_error(
          error,
          this.name,
          "fetch search results"
        );
      }
    };
    return retry_with_backoff(search_request);
  }
};

// node_modules/.pnpm/universal-user-agent@7.0.3/node_modules/universal-user-agent/index.js
function getUserAgent() {
  if (typeof navigator === "object" && "userAgent" in navigator) {
    return navigator.userAgent;
  }
  if (typeof process === "object" && process.version !== void 0) {
    return `Node.js/${process.version.substr(1)} (${process.platform}; ${process.arch})`;
  }
  return "<environment undetectable>";
}

// node_modules/.pnpm/before-after-hook@4.0.0/node_modules/before-after-hook/lib/register.js
function register(state, name2, method, options) {
  if (typeof method !== "function") {
    throw new Error("method for before hook must be a function");
  }
  if (!options) {
    options = {};
  }
  if (Array.isArray(name2)) {
    return name2.reverse().reduce((callback, name3) => {
      return register.bind(null, state, name3, callback, options);
    }, method)();
  }
  return Promise.resolve().then(() => {
    if (!state.registry[name2]) {
      return method(options);
    }
    return state.registry[name2].reduce((method2, registered) => {
      return registered.hook.bind(null, method2, options);
    }, method)();
  });
}

// node_modules/.pnpm/before-after-hook@4.0.0/node_modules/before-after-hook/lib/add.js
function addHook(state, kind, name2, hook7) {
  const orig = hook7;
  if (!state.registry[name2]) {
    state.registry[name2] = [];
  }
  if (kind === "before") {
    hook7 = (method, options) => {
      return Promise.resolve().then(orig.bind(null, options)).then(method.bind(null, options));
    };
  }
  if (kind === "after") {
    hook7 = (method, options) => {
      let result;
      return Promise.resolve().then(method.bind(null, options)).then((result_) => {
        result = result_;
        return orig(result, options);
      }).then(() => {
        return result;
      });
    };
  }
  if (kind === "error") {
    hook7 = (method, options) => {
      return Promise.resolve().then(method.bind(null, options)).catch((error) => {
        return orig(error, options);
      });
    };
  }
  state.registry[name2].push({
    hook: hook7,
    orig
  });
}

// node_modules/.pnpm/before-after-hook@4.0.0/node_modules/before-after-hook/lib/remove.js
function removeHook(state, name2, method) {
  if (!state.registry[name2]) {
    return;
  }
  const index = state.registry[name2].map((registered) => {
    return registered.orig;
  }).indexOf(method);
  if (index === -1) {
    return;
  }
  state.registry[name2].splice(index, 1);
}

// node_modules/.pnpm/before-after-hook@4.0.0/node_modules/before-after-hook/index.js
var bind = Function.bind;
var bindable = bind.bind(bind);
function bindApi(hook7, state, name2) {
  const removeHookRef = bindable(removeHook, null).apply(
    null,
    name2 ? [state, name2] : [state]
  );
  hook7.api = { remove: removeHookRef };
  hook7.remove = removeHookRef;
  ["before", "error", "after", "wrap"].forEach((kind) => {
    const args = name2 ? [state, kind, name2] : [state, kind];
    hook7[kind] = hook7.api[kind] = bindable(addHook, null).apply(null, args);
  });
}
function Singular() {
  const singularHookName = Symbol("Singular");
  const singularHookState = {
    registry: {}
  };
  const singularHook = register.bind(null, singularHookState, singularHookName);
  bindApi(singularHook, singularHookState, singularHookName);
  return singularHook;
}
function Collection() {
  const state = {
    registry: {}
  };
  const hook7 = register.bind(null, state);
  bindApi(hook7, state);
  return hook7;
}
var before_after_hook_default = { Singular, Collection };

// node_modules/.pnpm/@octokit+endpoint@11.0.3/node_modules/@octokit/endpoint/dist-bundle/index.js
var VERSION = "0.0.0-development";
var userAgent = `octokit-endpoint.js/${VERSION} ${getUserAgent()}`;
var DEFAULTS = {
  method: "GET",
  baseUrl: "https://api.github.com",
  headers: {
    accept: "application/vnd.github.v3+json",
    "user-agent": userAgent
  },
  mediaType: {
    format: ""
  }
};
function lowercaseKeys(object2) {
  if (!object2) {
    return {};
  }
  return Object.keys(object2).reduce((newObj, key) => {
    newObj[key.toLowerCase()] = object2[key];
    return newObj;
  }, {});
}
function isPlainObject(value) {
  if (typeof value !== "object" || value === null) return false;
  if (Object.prototype.toString.call(value) !== "[object Object]") return false;
  const proto = Object.getPrototypeOf(value);
  if (proto === null) return true;
  const Ctor = Object.prototype.hasOwnProperty.call(proto, "constructor") && proto.constructor;
  return typeof Ctor === "function" && Ctor instanceof Ctor && Function.prototype.call(Ctor) === Function.prototype.call(value);
}
function mergeDeep(defaults, options) {
  const result = Object.assign({}, defaults);
  Object.keys(options).forEach((key) => {
    if (isPlainObject(options[key])) {
      if (!(key in defaults)) Object.assign(result, { [key]: options[key] });
      else result[key] = mergeDeep(defaults[key], options[key]);
    } else {
      Object.assign(result, { [key]: options[key] });
    }
  });
  return result;
}
function removeUndefinedProperties(obj) {
  for (const key in obj) {
    if (obj[key] === void 0) {
      delete obj[key];
    }
  }
  return obj;
}
function merge(defaults, route, options) {
  if (typeof route === "string") {
    let [method, url2] = route.split(" ");
    options = Object.assign(url2 ? { method, url: url2 } : { url: method }, options);
  } else {
    options = Object.assign({}, route);
  }
  options.headers = lowercaseKeys(options.headers);
  removeUndefinedProperties(options);
  removeUndefinedProperties(options.headers);
  const mergedOptions = mergeDeep(defaults || {}, options);
  if (options.url === "/graphql") {
    if (defaults && defaults.mediaType.previews?.length) {
      mergedOptions.mediaType.previews = defaults.mediaType.previews.filter(
        (preview) => !mergedOptions.mediaType.previews.includes(preview)
      ).concat(mergedOptions.mediaType.previews);
    }
    mergedOptions.mediaType.previews = (mergedOptions.mediaType.previews || []).map((preview) => preview.replace(/-preview/, ""));
  }
  return mergedOptions;
}
function addQueryParameters(url2, parameters) {
  const separator = /\?/.test(url2) ? "&" : "?";
  const names = Object.keys(parameters);
  if (names.length === 0) {
    return url2;
  }
  return url2 + separator + names.map((name2) => {
    if (name2 === "q") {
      return "q=" + parameters.q.split("+").map(encodeURIComponent).join("+");
    }
    return `${name2}=${encodeURIComponent(parameters[name2])}`;
  }).join("&");
}
var urlVariableRegex = /\{[^{}}]+\}/g;
function removeNonChars(variableName) {
  return variableName.replace(/(?:^\W+)|(?:(?<!\W)\W+$)/g, "").split(/,/);
}
function extractUrlVariableNames(url2) {
  const matches = url2.match(urlVariableRegex);
  if (!matches) {
    return [];
  }
  return matches.map(removeNonChars).reduce((a, b) => a.concat(b), []);
}
function omit(object2, keysToOmit) {
  const result = { __proto__: null };
  for (const key of Object.keys(object2)) {
    if (keysToOmit.indexOf(key) === -1) {
      result[key] = object2[key];
    }
  }
  return result;
}
function encodeReserved(str) {
  return str.split(/(%[0-9A-Fa-f]{2})/g).map(function(part) {
    if (!/%[0-9A-Fa-f]/.test(part)) {
      part = encodeURI(part).replace(/%5B/g, "[").replace(/%5D/g, "]");
    }
    return part;
  }).join("");
}
function encodeUnreserved(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    return "%" + c.charCodeAt(0).toString(16).toUpperCase();
  });
}
function encodeValue(operator, value, key) {
  value = operator === "+" || operator === "#" ? encodeReserved(value) : encodeUnreserved(value);
  if (key) {
    return encodeUnreserved(key) + "=" + value;
  } else {
    return value;
  }
}
function isDefined(value) {
  return value !== void 0 && value !== null;
}
function isKeyOperator(operator) {
  return operator === ";" || operator === "&" || operator === "?";
}
function getValues(context, operator, key, modifier) {
  var value = context[key], result = [];
  if (isDefined(value) && value !== "") {
    if (typeof value === "string" || typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
      value = value.toString();
      if (modifier && modifier !== "*") {
        value = value.substring(0, parseInt(modifier, 10));
      }
      result.push(
        encodeValue(operator, value, isKeyOperator(operator) ? key : "")
      );
    } else {
      if (modifier === "*") {
        if (Array.isArray(value)) {
          value.filter(isDefined).forEach(function(value2) {
            result.push(
              encodeValue(operator, value2, isKeyOperator(operator) ? key : "")
            );
          });
        } else {
          Object.keys(value).forEach(function(k) {
            if (isDefined(value[k])) {
              result.push(encodeValue(operator, value[k], k));
            }
          });
        }
      } else {
        const tmp = [];
        if (Array.isArray(value)) {
          value.filter(isDefined).forEach(function(value2) {
            tmp.push(encodeValue(operator, value2));
          });
        } else {
          Object.keys(value).forEach(function(k) {
            if (isDefined(value[k])) {
              tmp.push(encodeUnreserved(k));
              tmp.push(encodeValue(operator, value[k].toString()));
            }
          });
        }
        if (isKeyOperator(operator)) {
          result.push(encodeUnreserved(key) + "=" + tmp.join(","));
        } else if (tmp.length !== 0) {
          result.push(tmp.join(","));
        }
      }
    }
  } else {
    if (operator === ";") {
      if (isDefined(value)) {
        result.push(encodeUnreserved(key));
      }
    } else if (value === "" && (operator === "&" || operator === "?")) {
      result.push(encodeUnreserved(key) + "=");
    } else if (value === "") {
      result.push("");
    }
  }
  return result;
}
function parseUrl(template) {
  return {
    expand: expand.bind(null, template)
  };
}
function expand(template, context) {
  var operators = ["+", "#", ".", "/", ";", "?", "&"];
  template = template.replace(
    /\{([^\{\}]+)\}|([^\{\}]+)/g,
    function(_, expression, literal2) {
      if (expression) {
        let operator = "";
        const values = [];
        if (operators.indexOf(expression.charAt(0)) !== -1) {
          operator = expression.charAt(0);
          expression = expression.substr(1);
        }
        expression.split(/,/g).forEach(function(variable) {
          var tmp = /([^:\*]*)(?::(\d+)|(\*))?/.exec(variable);
          values.push(getValues(context, operator, tmp[1], tmp[2] || tmp[3]));
        });
        if (operator && operator !== "+") {
          var separator = ",";
          if (operator === "?") {
            separator = "&";
          } else if (operator !== "#") {
            separator = operator;
          }
          return (values.length !== 0 ? operator : "") + values.join(separator);
        } else {
          return values.join(",");
        }
      } else {
        return encodeReserved(literal2);
      }
    }
  );
  if (template === "/") {
    return template;
  } else {
    return template.replace(/\/$/, "");
  }
}
function parse2(options) {
  let method = options.method.toUpperCase();
  let url2 = (options.url || "/").replace(/:([a-z]\w+)/g, "{$1}");
  let headers = Object.assign({}, options.headers);
  let body;
  let parameters = omit(options, [
    "method",
    "baseUrl",
    "url",
    "headers",
    "request",
    "mediaType"
  ]);
  const urlVariableNames = extractUrlVariableNames(url2);
  url2 = parseUrl(url2).expand(parameters);
  if (!/^http/.test(url2)) {
    url2 = options.baseUrl + url2;
  }
  const omittedParameters = Object.keys(options).filter((option) => urlVariableNames.includes(option)).concat("baseUrl");
  const remainingParameters = omit(parameters, omittedParameters);
  const isBinaryRequest = /application\/octet-stream/i.test(headers.accept);
  if (!isBinaryRequest) {
    if (options.mediaType.format) {
      headers.accept = headers.accept.split(/,/).map(
        (format) => format.replace(
          /application\/vnd(\.\w+)(\.v3)?(\.\w+)?(\+json)?$/,
          `application/vnd$1$2.${options.mediaType.format}`
        )
      ).join(",");
    }
    if (url2.endsWith("/graphql")) {
      if (options.mediaType.previews?.length) {
        const previewsFromAcceptHeader = headers.accept.match(/(?<![\w-])[\w-]+(?=-preview)/g) || [];
        headers.accept = previewsFromAcceptHeader.concat(options.mediaType.previews).map((preview) => {
          const format = options.mediaType.format ? `.${options.mediaType.format}` : "+json";
          return `application/vnd.github.${preview}-preview${format}`;
        }).join(",");
      }
    }
  }
  if (["GET", "HEAD"].includes(method)) {
    url2 = addQueryParameters(url2, remainingParameters);
  } else {
    if ("data" in remainingParameters) {
      body = remainingParameters.data;
    } else {
      if (Object.keys(remainingParameters).length) {
        body = remainingParameters;
      }
    }
  }
  if (!headers["content-type"] && typeof body !== "undefined") {
    headers["content-type"] = "application/json; charset=utf-8";
  }
  if (["PATCH", "PUT"].includes(method) && typeof body === "undefined") {
    body = "";
  }
  return Object.assign(
    { method, url: url2, headers },
    typeof body !== "undefined" ? { body } : null,
    options.request ? { request: options.request } : null
  );
}
function endpointWithDefaults(defaults, route, options) {
  return parse2(merge(defaults, route, options));
}
function withDefaults(oldDefaults, newDefaults) {
  const DEFAULTS2 = merge(oldDefaults, newDefaults);
  const endpoint2 = endpointWithDefaults.bind(null, DEFAULTS2);
  return Object.assign(endpoint2, {
    DEFAULTS: DEFAULTS2,
    defaults: withDefaults.bind(null, DEFAULTS2),
    merge: merge.bind(null, DEFAULTS2),
    parse: parse2
  });
}
var endpoint = withDefaults(null, DEFAULTS);

// node_modules/.pnpm/@octokit+request@10.0.8/node_modules/@octokit/request/dist-bundle/index.js
var import_fast_content_type_parse = __toESM(require_fast_content_type_parse(), 1);

// node_modules/.pnpm/json-with-bigint@3.5.8/node_modules/json-with-bigint/json-with-bigint.js
var intRegex = /^-?\d+$/;
var noiseValue = /^-?\d+n+$/;
var originalStringify = JSON.stringify;
var originalParse = JSON.parse;
var customFormat = /^-?\d+n$/;
var bigIntsStringify = /([\[:])?"(-?\d+)n"($|([\\n]|\s)*(\s|[\\n])*[,\}\]])/g;
var noiseStringify = /([\[:])?("-?\d+n+)n("$|"([\\n]|\s)*(\s|[\\n])*[,\}\]])/g;
var JSONStringify = (value, replacer, space) => {
  if ("rawJSON" in JSON) {
    return originalStringify(
      value,
      (key, value2) => {
        if (typeof value2 === "bigint") return JSON.rawJSON(value2.toString());
        if (typeof replacer === "function") return replacer(key, value2);
        if (Array.isArray(replacer) && replacer.includes(key)) return value2;
        return value2;
      },
      space
    );
  }
  if (!value) return originalStringify(value, replacer, space);
  const convertedToCustomJSON = originalStringify(
    value,
    (key, value2) => {
      const isNoise = typeof value2 === "string" && noiseValue.test(value2);
      if (isNoise) return value2.toString() + "n";
      if (typeof value2 === "bigint") return value2.toString() + "n";
      if (typeof replacer === "function") return replacer(key, value2);
      if (Array.isArray(replacer) && replacer.includes(key)) return value2;
      return value2;
    },
    space
  );
  const processedJSON = convertedToCustomJSON.replace(
    bigIntsStringify,
    "$1$2$3"
  );
  const denoisedJSON = processedJSON.replace(noiseStringify, "$1$2$3");
  return denoisedJSON;
};
var featureCache = /* @__PURE__ */ new Map();
var isContextSourceSupported = () => {
  const parseFingerprint = JSON.parse.toString();
  if (featureCache.has(parseFingerprint)) {
    return featureCache.get(parseFingerprint);
  }
  try {
    const result = JSON.parse(
      "1",
      (_, __, context) => !!context?.source && context.source === "1"
    );
    featureCache.set(parseFingerprint, result);
    return result;
  } catch {
    featureCache.set(parseFingerprint, false);
    return false;
  }
};
var convertMarkedBigIntsReviver = (key, value, context, userReviver) => {
  const isCustomFormatBigInt = typeof value === "string" && customFormat.test(value);
  if (isCustomFormatBigInt) return BigInt(value.slice(0, -1));
  const isNoiseValue = typeof value === "string" && noiseValue.test(value);
  if (isNoiseValue) return value.slice(0, -1);
  if (typeof userReviver !== "function") return value;
  return userReviver(key, value, context);
};
var JSONParseV2 = (text, reviver) => {
  return JSON.parse(text, (key, value, context) => {
    const isBigNumber = typeof value === "number" && (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER);
    const isInt = context && intRegex.test(context.source);
    const isBigInt = isBigNumber && isInt;
    if (isBigInt) return BigInt(context.source);
    if (typeof reviver !== "function") return value;
    return reviver(key, value, context);
  });
};
var MAX_INT = Number.MAX_SAFE_INTEGER.toString();
var MAX_DIGITS = MAX_INT.length;
var stringsOrLargeNumbers = /"(?:\\.|[^"])*"|-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?/g;
var noiseValueWithQuotes = /^"-?\d+n+"$/;
var JSONParse = (text, reviver) => {
  if (!text) return originalParse(text, reviver);
  if (isContextSourceSupported()) return JSONParseV2(text, reviver);
  const serializedData = text.replace(
    stringsOrLargeNumbers,
    (text2, digits, fractional, exponential) => {
      const isString = text2[0] === '"';
      const isNoise = isString && noiseValueWithQuotes.test(text2);
      if (isNoise) return text2.substring(0, text2.length - 1) + 'n"';
      const isFractionalOrExponential = fractional || exponential;
      const isLessThanMaxSafeInt = digits && (digits.length < MAX_DIGITS || digits.length === MAX_DIGITS && digits <= MAX_INT);
      if (isString || isFractionalOrExponential || isLessThanMaxSafeInt)
        return text2;
      return '"' + text2 + 'n"';
    }
  );
  return originalParse(
    serializedData,
    (key, value, context) => convertMarkedBigIntsReviver(key, value, context, reviver)
  );
};

// node_modules/.pnpm/@octokit+request-error@7.1.0/node_modules/@octokit/request-error/dist-src/index.js
var RequestError = class extends Error {
  name;
  /**
   * http status code
   */
  status;
  /**
   * Request options that lead to the error.
   */
  request;
  /**
   * Response object if a response was received
   */
  response;
  constructor(message, statusCode, options) {
    super(message, { cause: options.cause });
    this.name = "HttpError";
    this.status = Number.parseInt(statusCode);
    if (Number.isNaN(this.status)) {
      this.status = 0;
    }
    if ("response" in options) {
      this.response = options.response;
    }
    const requestCopy = Object.assign({}, options.request);
    if (options.request.headers.authorization) {
      requestCopy.headers = Object.assign({}, options.request.headers, {
        authorization: options.request.headers.authorization.replace(
          /(?<! ) .*$/,
          " [REDACTED]"
        )
      });
    }
    requestCopy.url = requestCopy.url.replace(/\bclient_secret=\w+/g, "client_secret=[REDACTED]").replace(/\baccess_token=\w+/g, "access_token=[REDACTED]");
    this.request = requestCopy;
  }
};

// node_modules/.pnpm/@octokit+request@10.0.8/node_modules/@octokit/request/dist-bundle/index.js
var VERSION2 = "10.0.8";
var defaults_default = {
  headers: {
    "user-agent": `octokit-request.js/${VERSION2} ${getUserAgent()}`
  }
};
function isPlainObject2(value) {
  if (typeof value !== "object" || value === null) return false;
  if (Object.prototype.toString.call(value) !== "[object Object]") return false;
  const proto = Object.getPrototypeOf(value);
  if (proto === null) return true;
  const Ctor = Object.prototype.hasOwnProperty.call(proto, "constructor") && proto.constructor;
  return typeof Ctor === "function" && Ctor instanceof Ctor && Function.prototype.call(Ctor) === Function.prototype.call(value);
}
var noop = () => "";
async function fetchWrapper(requestOptions) {
  const fetch2 = requestOptions.request?.fetch || globalThis.fetch;
  if (!fetch2) {
    throw new Error(
      "fetch is not set. Please pass a fetch implementation as new Octokit({ request: { fetch }}). Learn more at https://github.com/octokit/octokit.js/#fetch-missing"
    );
  }
  const log = requestOptions.request?.log || console;
  const parseSuccessResponseBody = requestOptions.request?.parseSuccessResponseBody !== false;
  const body = isPlainObject2(requestOptions.body) || Array.isArray(requestOptions.body) ? JSONStringify(requestOptions.body) : requestOptions.body;
  const requestHeaders = Object.fromEntries(
    Object.entries(requestOptions.headers).map(([name2, value]) => [
      name2,
      String(value)
    ])
  );
  let fetchResponse;
  try {
    fetchResponse = await fetch2(requestOptions.url, {
      method: requestOptions.method,
      body,
      redirect: requestOptions.request?.redirect,
      headers: requestHeaders,
      signal: requestOptions.request?.signal,
      // duplex must be set if request.body is ReadableStream or Async Iterables.
      // See https://fetch.spec.whatwg.org/#dom-requestinit-duplex.
      ...requestOptions.body && { duplex: "half" }
    });
  } catch (error) {
    let message = "Unknown Error";
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        error.status = 500;
        throw error;
      }
      message = error.message;
      if (error.name === "TypeError" && "cause" in error) {
        if (error.cause instanceof Error) {
          message = error.cause.message;
        } else if (typeof error.cause === "string") {
          message = error.cause;
        }
      }
    }
    const requestError = new RequestError(message, 500, {
      request: requestOptions
    });
    requestError.cause = error;
    throw requestError;
  }
  const status = fetchResponse.status;
  const url2 = fetchResponse.url;
  const responseHeaders = {};
  for (const [key, value] of fetchResponse.headers) {
    responseHeaders[key] = value;
  }
  const octokitResponse = {
    url: url2,
    status,
    headers: responseHeaders,
    data: ""
  };
  if ("deprecation" in responseHeaders) {
    const matches = responseHeaders.link && responseHeaders.link.match(/<([^<>]+)>; rel="deprecation"/);
    const deprecationLink = matches && matches.pop();
    log.warn(
      `[@octokit/request] "${requestOptions.method} ${requestOptions.url}" is deprecated. It is scheduled to be removed on ${responseHeaders.sunset}${deprecationLink ? `. See ${deprecationLink}` : ""}`
    );
  }
  if (status === 204 || status === 205) {
    return octokitResponse;
  }
  if (requestOptions.method === "HEAD") {
    if (status < 400) {
      return octokitResponse;
    }
    throw new RequestError(fetchResponse.statusText, status, {
      response: octokitResponse,
      request: requestOptions
    });
  }
  if (status === 304) {
    octokitResponse.data = await getResponseData(fetchResponse);
    throw new RequestError("Not modified", status, {
      response: octokitResponse,
      request: requestOptions
    });
  }
  if (status >= 400) {
    octokitResponse.data = await getResponseData(fetchResponse);
    throw new RequestError(toErrorMessage(octokitResponse.data), status, {
      response: octokitResponse,
      request: requestOptions
    });
  }
  octokitResponse.data = parseSuccessResponseBody ? await getResponseData(fetchResponse) : fetchResponse.body;
  return octokitResponse;
}
async function getResponseData(response) {
  const contentType = response.headers.get("content-type");
  if (!contentType) {
    return response.text().catch(noop);
  }
  const mimetype = (0, import_fast_content_type_parse.safeParse)(contentType);
  if (isJSONResponse(mimetype)) {
    let text = "";
    try {
      text = await response.text();
      return JSONParse(text);
    } catch (err) {
      return text;
    }
  } else if (mimetype.type.startsWith("text/") || mimetype.parameters.charset?.toLowerCase() === "utf-8") {
    return response.text().catch(noop);
  } else {
    return response.arrayBuffer().catch(
      /* v8 ignore next -- @preserve */
      () => new ArrayBuffer(0)
    );
  }
}
function isJSONResponse(mimetype) {
  return mimetype.type === "application/json" || mimetype.type === "application/scim+json";
}
function toErrorMessage(data) {
  if (typeof data === "string") {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return "Unknown error";
  }
  if ("message" in data) {
    const suffix = "documentation_url" in data ? ` - ${data.documentation_url}` : "";
    return Array.isArray(data.errors) ? `${data.message}: ${data.errors.map((v) => JSON.stringify(v)).join(", ")}${suffix}` : `${data.message}${suffix}`;
  }
  return `Unknown error: ${JSON.stringify(data)}`;
}
function withDefaults2(oldEndpoint, newDefaults) {
  const endpoint2 = oldEndpoint.defaults(newDefaults);
  const newApi = function(route, parameters) {
    const endpointOptions = endpoint2.merge(route, parameters);
    if (!endpointOptions.request || !endpointOptions.request.hook) {
      return fetchWrapper(endpoint2.parse(endpointOptions));
    }
    const request2 = (route2, parameters2) => {
      return fetchWrapper(
        endpoint2.parse(endpoint2.merge(route2, parameters2))
      );
    };
    Object.assign(request2, {
      endpoint: endpoint2,
      defaults: withDefaults2.bind(null, endpoint2)
    });
    return endpointOptions.request.hook(request2, endpointOptions);
  };
  return Object.assign(newApi, {
    endpoint: endpoint2,
    defaults: withDefaults2.bind(null, endpoint2)
  });
}
var request = withDefaults2(endpoint, defaults_default);

// node_modules/.pnpm/@octokit+graphql@9.0.3/node_modules/@octokit/graphql/dist-bundle/index.js
var VERSION3 = "0.0.0-development";
function _buildMessageForResponseErrors(data) {
  return `Request failed due to following response errors:
` + data.errors.map((e) => ` - ${e.message}`).join("\n");
}
var GraphqlResponseError = class extends Error {
  constructor(request2, headers, response) {
    super(_buildMessageForResponseErrors(response));
    this.request = request2;
    this.headers = headers;
    this.response = response;
    this.errors = response.errors;
    this.data = response.data;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  name = "GraphqlResponseError";
  errors;
  data;
};
var NON_VARIABLE_OPTIONS = [
  "method",
  "baseUrl",
  "url",
  "headers",
  "request",
  "query",
  "mediaType",
  "operationName"
];
var FORBIDDEN_VARIABLE_OPTIONS = ["query", "method", "url"];
var GHES_V3_SUFFIX_REGEX = /\/api\/v3\/?$/;
function graphql(request2, query, options) {
  if (options) {
    if (typeof query === "string" && "query" in options) {
      return Promise.reject(
        new Error(`[@octokit/graphql] "query" cannot be used as variable name`)
      );
    }
    for (const key in options) {
      if (!FORBIDDEN_VARIABLE_OPTIONS.includes(key)) continue;
      return Promise.reject(
        new Error(
          `[@octokit/graphql] "${key}" cannot be used as variable name`
        )
      );
    }
  }
  const parsedOptions = typeof query === "string" ? Object.assign({ query }, options) : query;
  const requestOptions = Object.keys(
    parsedOptions
  ).reduce((result, key) => {
    if (NON_VARIABLE_OPTIONS.includes(key)) {
      result[key] = parsedOptions[key];
      return result;
    }
    if (!result.variables) {
      result.variables = {};
    }
    result.variables[key] = parsedOptions[key];
    return result;
  }, {});
  const baseUrl = parsedOptions.baseUrl || request2.endpoint.DEFAULTS.baseUrl;
  if (GHES_V3_SUFFIX_REGEX.test(baseUrl)) {
    requestOptions.url = baseUrl.replace(GHES_V3_SUFFIX_REGEX, "/api/graphql");
  }
  return request2(requestOptions).then((response) => {
    if (response.data.errors) {
      const headers = {};
      for (const key of Object.keys(response.headers)) {
        headers[key] = response.headers[key];
      }
      throw new GraphqlResponseError(
        requestOptions,
        headers,
        response.data
      );
    }
    return response.data.data;
  });
}
function withDefaults3(request2, newDefaults) {
  const newRequest = request2.defaults(newDefaults);
  const newApi = (query, options) => {
    return graphql(newRequest, query, options);
  };
  return Object.assign(newApi, {
    defaults: withDefaults3.bind(null, newRequest),
    endpoint: newRequest.endpoint
  });
}
var graphql2 = withDefaults3(request, {
  headers: {
    "user-agent": `octokit-graphql.js/${VERSION3} ${getUserAgent()}`
  },
  method: "POST",
  url: "/graphql"
});
function withCustomRequest(customRequest) {
  return withDefaults3(customRequest, {
    method: "POST",
    url: "/graphql"
  });
}

// node_modules/.pnpm/@octokit+auth-token@6.0.0/node_modules/@octokit/auth-token/dist-bundle/index.js
var b64url = "(?:[a-zA-Z0-9_-]+)";
var sep = "\\.";
var jwtRE = new RegExp(`^${b64url}${sep}${b64url}${sep}${b64url}$`);
var isJWT = jwtRE.test.bind(jwtRE);
async function auth(token) {
  const isApp = isJWT(token);
  const isInstallation = token.startsWith("v1.") || token.startsWith("ghs_");
  const isUserToServer = token.startsWith("ghu_");
  const tokenType = isApp ? "app" : isInstallation ? "installation" : isUserToServer ? "user-to-server" : "oauth";
  return {
    type: "token",
    token,
    tokenType
  };
}
function withAuthorizationPrefix(token) {
  if (token.split(/\./).length === 3) {
    return `bearer ${token}`;
  }
  return `token ${token}`;
}
async function hook(token, request2, route, parameters) {
  const endpoint2 = request2.endpoint.merge(
    route,
    parameters
  );
  endpoint2.headers.authorization = withAuthorizationPrefix(token);
  return request2(endpoint2);
}
var createTokenAuth = function createTokenAuth2(token) {
  if (!token) {
    throw new Error("[@octokit/auth-token] No token passed to createTokenAuth");
  }
  if (typeof token !== "string") {
    throw new Error(
      "[@octokit/auth-token] Token passed to createTokenAuth is not a string"
    );
  }
  token = token.replace(/^(token|bearer) +/i, "");
  return Object.assign(auth.bind(null, token), {
    hook: hook.bind(null, token)
  });
};

// node_modules/.pnpm/@octokit+core@7.0.6/node_modules/@octokit/core/dist-src/version.js
var VERSION4 = "7.0.6";

// node_modules/.pnpm/@octokit+core@7.0.6/node_modules/@octokit/core/dist-src/index.js
var noop2 = () => {
};
var consoleWarn = console.warn.bind(console);
var consoleError = console.error.bind(console);
function createLogger(logger = {}) {
  if (typeof logger.debug !== "function") {
    logger.debug = noop2;
  }
  if (typeof logger.info !== "function") {
    logger.info = noop2;
  }
  if (typeof logger.warn !== "function") {
    logger.warn = consoleWarn;
  }
  if (typeof logger.error !== "function") {
    logger.error = consoleError;
  }
  return logger;
}
var userAgentTrail = `octokit-core.js/${VERSION4} ${getUserAgent()}`;
var Octokit = class {
  static VERSION = VERSION4;
  static defaults(defaults) {
    const OctokitWithDefaults = class extends this {
      constructor(...args) {
        const options = args[0] || {};
        if (typeof defaults === "function") {
          super(defaults(options));
          return;
        }
        super(
          Object.assign(
            {},
            defaults,
            options,
            options.userAgent && defaults.userAgent ? {
              userAgent: `${options.userAgent} ${defaults.userAgent}`
            } : null
          )
        );
      }
    };
    return OctokitWithDefaults;
  }
  static plugins = [];
  /**
   * Attach a plugin (or many) to your Octokit instance.
   *
   * @example
   * const API = Octokit.plugin(plugin1, plugin2, plugin3, ...)
   */
  static plugin(...newPlugins) {
    const currentPlugins = this.plugins;
    const NewOctokit = class extends this {
      static plugins = currentPlugins.concat(
        newPlugins.filter((plugin) => !currentPlugins.includes(plugin))
      );
    };
    return NewOctokit;
  }
  constructor(options = {}) {
    const hook7 = new before_after_hook_default.Collection();
    const requestDefaults = {
      baseUrl: request.endpoint.DEFAULTS.baseUrl,
      headers: {},
      request: Object.assign({}, options.request, {
        // @ts-ignore internal usage only, no need to type
        hook: hook7.bind(null, "request")
      }),
      mediaType: {
        previews: [],
        format: ""
      }
    };
    requestDefaults.headers["user-agent"] = options.userAgent ? `${options.userAgent} ${userAgentTrail}` : userAgentTrail;
    if (options.baseUrl) {
      requestDefaults.baseUrl = options.baseUrl;
    }
    if (options.previews) {
      requestDefaults.mediaType.previews = options.previews;
    }
    if (options.timeZone) {
      requestDefaults.headers["time-zone"] = options.timeZone;
    }
    this.request = request.defaults(requestDefaults);
    this.graphql = withCustomRequest(this.request).defaults(requestDefaults);
    this.log = createLogger(options.log);
    this.hook = hook7;
    if (!options.authStrategy) {
      if (!options.auth) {
        this.auth = async () => ({
          type: "unauthenticated"
        });
      } else {
        const auth7 = createTokenAuth(options.auth);
        hook7.wrap("request", auth7.hook);
        this.auth = auth7;
      }
    } else {
      const { authStrategy, ...otherOptions } = options;
      const auth7 = authStrategy(
        Object.assign(
          {
            request: this.request,
            log: this.log,
            // we pass the current octokit instance as well as its constructor options
            // to allow for authentication strategies that return a new octokit instance
            // that shares the same internal state as the current one. The original
            // requirement for this was the "event-octokit" authentication strategy
            // of https://github.com/probot/octokit-auth-probot.
            octokit: this,
            octokitOptions: otherOptions
          },
          options.auth
        )
      );
      hook7.wrap("request", auth7.hook);
      this.auth = auth7;
    }
    const classConstructor = this.constructor;
    for (let i = 0; i < classConstructor.plugins.length; ++i) {
      Object.assign(this, classConstructor.plugins[i](this, options));
    }
  }
  // assigned during constructor
  request;
  graphql;
  log;
  hook;
  // TODO: type `octokit.auth` based on passed options.authStrategy
  auth;
};

// node_modules/.pnpm/@octokit+plugin-paginate-rest@14.0.0_@octokit+core@7.0.6/node_modules/@octokit/plugin-paginate-rest/dist-bundle/index.js
var VERSION5 = "0.0.0-development";
function normalizePaginatedListResponse(response) {
  if (!response.data) {
    return {
      ...response,
      data: []
    };
  }
  const responseNeedsNormalization = ("total_count" in response.data || "total_commits" in response.data) && !("url" in response.data);
  if (!responseNeedsNormalization) return response;
  const incompleteResults = response.data.incomplete_results;
  const repositorySelection = response.data.repository_selection;
  const totalCount = response.data.total_count;
  const totalCommits = response.data.total_commits;
  delete response.data.incomplete_results;
  delete response.data.repository_selection;
  delete response.data.total_count;
  delete response.data.total_commits;
  const namespaceKey = Object.keys(response.data)[0];
  const data = response.data[namespaceKey];
  response.data = data;
  if (typeof incompleteResults !== "undefined") {
    response.data.incomplete_results = incompleteResults;
  }
  if (typeof repositorySelection !== "undefined") {
    response.data.repository_selection = repositorySelection;
  }
  response.data.total_count = totalCount;
  response.data.total_commits = totalCommits;
  return response;
}
function iterator(octokit, route, parameters) {
  const options = typeof route === "function" ? route.endpoint(parameters) : octokit.request.endpoint(route, parameters);
  const requestMethod = typeof route === "function" ? route : octokit.request;
  const method = options.method;
  const headers = options.headers;
  let url2 = options.url;
  return {
    [Symbol.asyncIterator]: () => ({
      async next() {
        if (!url2) return { done: true };
        try {
          const response = await requestMethod({ method, url: url2, headers });
          const normalizedResponse = normalizePaginatedListResponse(response);
          url2 = ((normalizedResponse.headers.link || "").match(
            /<([^<>]+)>;\s*rel="next"/
          ) || [])[1];
          if (!url2 && "total_commits" in normalizedResponse.data) {
            const parsedUrl = new URL(normalizedResponse.url);
            const params = parsedUrl.searchParams;
            const page = parseInt(params.get("page") || "1", 10);
            const per_page = parseInt(params.get("per_page") || "250", 10);
            if (page * per_page < normalizedResponse.data.total_commits) {
              params.set("page", String(page + 1));
              url2 = parsedUrl.toString();
            }
          }
          return { value: normalizedResponse };
        } catch (error) {
          if (error.status !== 409) throw error;
          url2 = "";
          return {
            value: {
              status: 200,
              headers: {},
              data: []
            }
          };
        }
      }
    })
  };
}
function paginate(octokit, route, parameters, mapFn) {
  if (typeof parameters === "function") {
    mapFn = parameters;
    parameters = void 0;
  }
  return gather(
    octokit,
    [],
    iterator(octokit, route, parameters)[Symbol.asyncIterator](),
    mapFn
  );
}
function gather(octokit, results, iterator2, mapFn) {
  return iterator2.next().then((result) => {
    if (result.done) {
      return results;
    }
    let earlyExit = false;
    function done() {
      earlyExit = true;
    }
    results = results.concat(
      mapFn ? mapFn(result.value, done) : result.value.data
    );
    if (earlyExit) {
      return results;
    }
    return gather(octokit, results, iterator2, mapFn);
  });
}
var composePaginateRest = Object.assign(paginate, {
  iterator
});
function paginateRest(octokit) {
  return {
    paginate: Object.assign(paginate.bind(null, octokit), {
      iterator: iterator.bind(null, octokit)
    })
  };
}
paginateRest.VERSION = VERSION5;

// node_modules/.pnpm/@octokit+plugin-paginate-graphql@6.0.0_@octokit+core@7.0.6/node_modules/@octokit/plugin-paginate-graphql/dist-bundle/index.js
var generateMessage = (path, cursorValue) => `The cursor at "${path.join(
  ","
)}" did not change its value "${cursorValue}" after a page transition. Please make sure your that your query is set up correctly.`;
var MissingCursorChange = class extends Error {
  constructor(pageInfo, cursorValue) {
    super(generateMessage(pageInfo.pathInQuery, cursorValue));
    this.pageInfo = pageInfo;
    this.cursorValue = cursorValue;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  name = "MissingCursorChangeError";
};
var MissingPageInfo = class extends Error {
  constructor(response) {
    super(
      `No pageInfo property found in response. Please make sure to specify the pageInfo in your query. Response-Data: ${JSON.stringify(
        response,
        null,
        2
      )}`
    );
    this.response = response;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  name = "MissingPageInfo";
};
var isObject = (value) => Object.prototype.toString.call(value) === "[object Object]";
function findPaginatedResourcePath(responseData) {
  const paginatedResourcePath = deepFindPathToProperty(
    responseData,
    "pageInfo"
  );
  if (paginatedResourcePath.length === 0) {
    throw new MissingPageInfo(responseData);
  }
  return paginatedResourcePath;
}
var deepFindPathToProperty = (object2, searchProp, path = []) => {
  for (const key of Object.keys(object2)) {
    const currentPath = [...path, key];
    const currentValue = object2[key];
    if (isObject(currentValue)) {
      if (currentValue.hasOwnProperty(searchProp)) {
        return currentPath;
      }
      const result = deepFindPathToProperty(
        currentValue,
        searchProp,
        currentPath
      );
      if (result.length > 0) {
        return result;
      }
    }
  }
  return [];
};
var get = (object2, path) => {
  return path.reduce((current, nextProperty) => current[nextProperty], object2);
};
var set = (object2, path, mutator) => {
  const lastProperty = path[path.length - 1];
  const parentPath = [...path].slice(0, -1);
  const parent = get(object2, parentPath);
  if (typeof mutator === "function") {
    parent[lastProperty] = mutator(parent[lastProperty]);
  } else {
    parent[lastProperty] = mutator;
  }
};
var extractPageInfos = (responseData) => {
  const pageInfoPath = findPaginatedResourcePath(responseData);
  return {
    pathInQuery: pageInfoPath,
    pageInfo: get(responseData, [...pageInfoPath, "pageInfo"])
  };
};
var isForwardSearch = (givenPageInfo) => {
  return givenPageInfo.hasOwnProperty("hasNextPage");
};
var getCursorFrom = (pageInfo) => isForwardSearch(pageInfo) ? pageInfo.endCursor : pageInfo.startCursor;
var hasAnotherPage = (pageInfo) => isForwardSearch(pageInfo) ? pageInfo.hasNextPage : pageInfo.hasPreviousPage;
var createIterator = (octokit) => {
  return (query, initialParameters = {}) => {
    let nextPageExists = true;
    let parameters = { ...initialParameters };
    return {
      [Symbol.asyncIterator]: () => ({
        async next() {
          if (!nextPageExists) return { done: true, value: {} };
          const response = await octokit.graphql(
            query,
            parameters
          );
          const pageInfoContext = extractPageInfos(response);
          const nextCursorValue = getCursorFrom(pageInfoContext.pageInfo);
          nextPageExists = hasAnotherPage(pageInfoContext.pageInfo);
          if (nextPageExists && nextCursorValue === parameters.cursor) {
            throw new MissingCursorChange(pageInfoContext, nextCursorValue);
          }
          parameters = {
            ...parameters,
            cursor: nextCursorValue
          };
          return { done: false, value: response };
        }
      })
    };
  };
};
var mergeResponses = (response1, response2) => {
  if (Object.keys(response1).length === 0) {
    return Object.assign(response1, response2);
  }
  const path = findPaginatedResourcePath(response1);
  const nodesPath = [...path, "nodes"];
  const newNodes = get(response2, nodesPath);
  if (newNodes) {
    set(response1, nodesPath, (values) => {
      return [...values, ...newNodes];
    });
  }
  const edgesPath = [...path, "edges"];
  const newEdges = get(response2, edgesPath);
  if (newEdges) {
    set(response1, edgesPath, (values) => {
      return [...values, ...newEdges];
    });
  }
  const pageInfoPath = [...path, "pageInfo"];
  set(response1, pageInfoPath, get(response2, pageInfoPath));
  return response1;
};
var createPaginate = (octokit) => {
  const iterator2 = createIterator(octokit);
  return async (query, initialParameters = {}) => {
    let mergedResponse = {};
    for await (const response of iterator2(
      query,
      initialParameters
    )) {
      mergedResponse = mergeResponses(mergedResponse, response);
    }
    return mergedResponse;
  };
};
function paginateGraphQL(octokit) {
  return {
    graphql: Object.assign(octokit.graphql, {
      paginate: Object.assign(createPaginate(octokit), {
        iterator: createIterator(octokit)
      })
    })
  };
}

// node_modules/.pnpm/@octokit+plugin-rest-endpoint-methods@17.0.0_@octokit+core@7.0.6/node_modules/@octokit/plugin-rest-endpoint-methods/dist-src/version.js
var VERSION6 = "17.0.0";

// node_modules/.pnpm/@octokit+plugin-rest-endpoint-methods@17.0.0_@octokit+core@7.0.6/node_modules/@octokit/plugin-rest-endpoint-methods/dist-src/generated/endpoints.js
var Endpoints = {
  actions: {
    addCustomLabelsToSelfHostedRunnerForOrg: [
      "POST /orgs/{org}/actions/runners/{runner_id}/labels"
    ],
    addCustomLabelsToSelfHostedRunnerForRepo: [
      "POST /repos/{owner}/{repo}/actions/runners/{runner_id}/labels"
    ],
    addRepoAccessToSelfHostedRunnerGroupInOrg: [
      "PUT /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories/{repository_id}"
    ],
    addSelectedRepoToOrgSecret: [
      "PUT /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}"
    ],
    addSelectedRepoToOrgVariable: [
      "PUT /orgs/{org}/actions/variables/{name}/repositories/{repository_id}"
    ],
    approveWorkflowRun: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/approve"
    ],
    cancelWorkflowRun: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel"
    ],
    createEnvironmentVariable: [
      "POST /repos/{owner}/{repo}/environments/{environment_name}/variables"
    ],
    createHostedRunnerForOrg: ["POST /orgs/{org}/actions/hosted-runners"],
    createOrUpdateEnvironmentSecret: [
      "PUT /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}"
    ],
    createOrUpdateOrgSecret: ["PUT /orgs/{org}/actions/secrets/{secret_name}"],
    createOrUpdateRepoSecret: [
      "PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}"
    ],
    createOrgVariable: ["POST /orgs/{org}/actions/variables"],
    createRegistrationTokenForOrg: [
      "POST /orgs/{org}/actions/runners/registration-token"
    ],
    createRegistrationTokenForRepo: [
      "POST /repos/{owner}/{repo}/actions/runners/registration-token"
    ],
    createRemoveTokenForOrg: ["POST /orgs/{org}/actions/runners/remove-token"],
    createRemoveTokenForRepo: [
      "POST /repos/{owner}/{repo}/actions/runners/remove-token"
    ],
    createRepoVariable: ["POST /repos/{owner}/{repo}/actions/variables"],
    createWorkflowDispatch: [
      "POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches"
    ],
    deleteActionsCacheById: [
      "DELETE /repos/{owner}/{repo}/actions/caches/{cache_id}"
    ],
    deleteActionsCacheByKey: [
      "DELETE /repos/{owner}/{repo}/actions/caches{?key,ref}"
    ],
    deleteArtifact: [
      "DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}"
    ],
    deleteCustomImageFromOrg: [
      "DELETE /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}"
    ],
    deleteCustomImageVersionFromOrg: [
      "DELETE /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}/versions/{version}"
    ],
    deleteEnvironmentSecret: [
      "DELETE /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}"
    ],
    deleteEnvironmentVariable: [
      "DELETE /repos/{owner}/{repo}/environments/{environment_name}/variables/{name}"
    ],
    deleteHostedRunnerForOrg: [
      "DELETE /orgs/{org}/actions/hosted-runners/{hosted_runner_id}"
    ],
    deleteOrgSecret: ["DELETE /orgs/{org}/actions/secrets/{secret_name}"],
    deleteOrgVariable: ["DELETE /orgs/{org}/actions/variables/{name}"],
    deleteRepoSecret: [
      "DELETE /repos/{owner}/{repo}/actions/secrets/{secret_name}"
    ],
    deleteRepoVariable: [
      "DELETE /repos/{owner}/{repo}/actions/variables/{name}"
    ],
    deleteSelfHostedRunnerFromOrg: [
      "DELETE /orgs/{org}/actions/runners/{runner_id}"
    ],
    deleteSelfHostedRunnerFromRepo: [
      "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}"
    ],
    deleteWorkflowRun: ["DELETE /repos/{owner}/{repo}/actions/runs/{run_id}"],
    deleteWorkflowRunLogs: [
      "DELETE /repos/{owner}/{repo}/actions/runs/{run_id}/logs"
    ],
    disableSelectedRepositoryGithubActionsOrganization: [
      "DELETE /orgs/{org}/actions/permissions/repositories/{repository_id}"
    ],
    disableWorkflow: [
      "PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/disable"
    ],
    downloadArtifact: [
      "GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}"
    ],
    downloadJobLogsForWorkflowRun: [
      "GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs"
    ],
    downloadWorkflowRunAttemptLogs: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/logs"
    ],
    downloadWorkflowRunLogs: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs"
    ],
    enableSelectedRepositoryGithubActionsOrganization: [
      "PUT /orgs/{org}/actions/permissions/repositories/{repository_id}"
    ],
    enableWorkflow: [
      "PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/enable"
    ],
    forceCancelWorkflowRun: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/force-cancel"
    ],
    generateRunnerJitconfigForOrg: [
      "POST /orgs/{org}/actions/runners/generate-jitconfig"
    ],
    generateRunnerJitconfigForRepo: [
      "POST /repos/{owner}/{repo}/actions/runners/generate-jitconfig"
    ],
    getActionsCacheList: ["GET /repos/{owner}/{repo}/actions/caches"],
    getActionsCacheUsage: ["GET /repos/{owner}/{repo}/actions/cache/usage"],
    getActionsCacheUsageByRepoForOrg: [
      "GET /orgs/{org}/actions/cache/usage-by-repository"
    ],
    getActionsCacheUsageForOrg: ["GET /orgs/{org}/actions/cache/usage"],
    getAllowedActionsOrganization: [
      "GET /orgs/{org}/actions/permissions/selected-actions"
    ],
    getAllowedActionsRepository: [
      "GET /repos/{owner}/{repo}/actions/permissions/selected-actions"
    ],
    getArtifact: ["GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}"],
    getCustomImageForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}"
    ],
    getCustomImageVersionForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}/versions/{version}"
    ],
    getCustomOidcSubClaimForRepo: [
      "GET /repos/{owner}/{repo}/actions/oidc/customization/sub"
    ],
    getEnvironmentPublicKey: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/secrets/public-key"
    ],
    getEnvironmentSecret: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}"
    ],
    getEnvironmentVariable: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/variables/{name}"
    ],
    getGithubActionsDefaultWorkflowPermissionsOrganization: [
      "GET /orgs/{org}/actions/permissions/workflow"
    ],
    getGithubActionsDefaultWorkflowPermissionsRepository: [
      "GET /repos/{owner}/{repo}/actions/permissions/workflow"
    ],
    getGithubActionsPermissionsOrganization: [
      "GET /orgs/{org}/actions/permissions"
    ],
    getGithubActionsPermissionsRepository: [
      "GET /repos/{owner}/{repo}/actions/permissions"
    ],
    getHostedRunnerForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/{hosted_runner_id}"
    ],
    getHostedRunnersGithubOwnedImagesForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/images/github-owned"
    ],
    getHostedRunnersLimitsForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/limits"
    ],
    getHostedRunnersMachineSpecsForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/machine-sizes"
    ],
    getHostedRunnersPartnerImagesForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/images/partner"
    ],
    getHostedRunnersPlatformsForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/platforms"
    ],
    getJobForWorkflowRun: ["GET /repos/{owner}/{repo}/actions/jobs/{job_id}"],
    getOrgPublicKey: ["GET /orgs/{org}/actions/secrets/public-key"],
    getOrgSecret: ["GET /orgs/{org}/actions/secrets/{secret_name}"],
    getOrgVariable: ["GET /orgs/{org}/actions/variables/{name}"],
    getPendingDeploymentsForRun: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments"
    ],
    getRepoPermissions: [
      "GET /repos/{owner}/{repo}/actions/permissions",
      {},
      { renamed: ["actions", "getGithubActionsPermissionsRepository"] }
    ],
    getRepoPublicKey: ["GET /repos/{owner}/{repo}/actions/secrets/public-key"],
    getRepoSecret: ["GET /repos/{owner}/{repo}/actions/secrets/{secret_name}"],
    getRepoVariable: ["GET /repos/{owner}/{repo}/actions/variables/{name}"],
    getReviewsForRun: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals"
    ],
    getSelfHostedRunnerForOrg: ["GET /orgs/{org}/actions/runners/{runner_id}"],
    getSelfHostedRunnerForRepo: [
      "GET /repos/{owner}/{repo}/actions/runners/{runner_id}"
    ],
    getWorkflow: ["GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}"],
    getWorkflowAccessToRepository: [
      "GET /repos/{owner}/{repo}/actions/permissions/access"
    ],
    getWorkflowRun: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}"],
    getWorkflowRunAttempt: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}"
    ],
    getWorkflowRunUsage: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/timing"
    ],
    getWorkflowUsage: [
      "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/timing"
    ],
    listArtifactsForRepo: ["GET /repos/{owner}/{repo}/actions/artifacts"],
    listCustomImageVersionsForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}/versions"
    ],
    listCustomImagesForOrg: [
      "GET /orgs/{org}/actions/hosted-runners/images/custom"
    ],
    listEnvironmentSecrets: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/secrets"
    ],
    listEnvironmentVariables: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/variables"
    ],
    listGithubHostedRunnersInGroupForOrg: [
      "GET /orgs/{org}/actions/runner-groups/{runner_group_id}/hosted-runners"
    ],
    listHostedRunnersForOrg: ["GET /orgs/{org}/actions/hosted-runners"],
    listJobsForWorkflowRun: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs"
    ],
    listJobsForWorkflowRunAttempt: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/jobs"
    ],
    listLabelsForSelfHostedRunnerForOrg: [
      "GET /orgs/{org}/actions/runners/{runner_id}/labels"
    ],
    listLabelsForSelfHostedRunnerForRepo: [
      "GET /repos/{owner}/{repo}/actions/runners/{runner_id}/labels"
    ],
    listOrgSecrets: ["GET /orgs/{org}/actions/secrets"],
    listOrgVariables: ["GET /orgs/{org}/actions/variables"],
    listRepoOrganizationSecrets: [
      "GET /repos/{owner}/{repo}/actions/organization-secrets"
    ],
    listRepoOrganizationVariables: [
      "GET /repos/{owner}/{repo}/actions/organization-variables"
    ],
    listRepoSecrets: ["GET /repos/{owner}/{repo}/actions/secrets"],
    listRepoVariables: ["GET /repos/{owner}/{repo}/actions/variables"],
    listRepoWorkflows: ["GET /repos/{owner}/{repo}/actions/workflows"],
    listRunnerApplicationsForOrg: ["GET /orgs/{org}/actions/runners/downloads"],
    listRunnerApplicationsForRepo: [
      "GET /repos/{owner}/{repo}/actions/runners/downloads"
    ],
    listSelectedReposForOrgSecret: [
      "GET /orgs/{org}/actions/secrets/{secret_name}/repositories"
    ],
    listSelectedReposForOrgVariable: [
      "GET /orgs/{org}/actions/variables/{name}/repositories"
    ],
    listSelectedRepositoriesEnabledGithubActionsOrganization: [
      "GET /orgs/{org}/actions/permissions/repositories"
    ],
    listSelfHostedRunnersForOrg: ["GET /orgs/{org}/actions/runners"],
    listSelfHostedRunnersForRepo: ["GET /repos/{owner}/{repo}/actions/runners"],
    listWorkflowRunArtifacts: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts"
    ],
    listWorkflowRuns: [
      "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs"
    ],
    listWorkflowRunsForRepo: ["GET /repos/{owner}/{repo}/actions/runs"],
    reRunJobForWorkflowRun: [
      "POST /repos/{owner}/{repo}/actions/jobs/{job_id}/rerun"
    ],
    reRunWorkflow: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun"],
    reRunWorkflowFailedJobs: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun-failed-jobs"
    ],
    removeAllCustomLabelsFromSelfHostedRunnerForOrg: [
      "DELETE /orgs/{org}/actions/runners/{runner_id}/labels"
    ],
    removeAllCustomLabelsFromSelfHostedRunnerForRepo: [
      "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}/labels"
    ],
    removeCustomLabelFromSelfHostedRunnerForOrg: [
      "DELETE /orgs/{org}/actions/runners/{runner_id}/labels/{name}"
    ],
    removeCustomLabelFromSelfHostedRunnerForRepo: [
      "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}/labels/{name}"
    ],
    removeSelectedRepoFromOrgSecret: [
      "DELETE /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}"
    ],
    removeSelectedRepoFromOrgVariable: [
      "DELETE /orgs/{org}/actions/variables/{name}/repositories/{repository_id}"
    ],
    reviewCustomGatesForRun: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/deployment_protection_rule"
    ],
    reviewPendingDeploymentsForRun: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments"
    ],
    setAllowedActionsOrganization: [
      "PUT /orgs/{org}/actions/permissions/selected-actions"
    ],
    setAllowedActionsRepository: [
      "PUT /repos/{owner}/{repo}/actions/permissions/selected-actions"
    ],
    setCustomLabelsForSelfHostedRunnerForOrg: [
      "PUT /orgs/{org}/actions/runners/{runner_id}/labels"
    ],
    setCustomLabelsForSelfHostedRunnerForRepo: [
      "PUT /repos/{owner}/{repo}/actions/runners/{runner_id}/labels"
    ],
    setCustomOidcSubClaimForRepo: [
      "PUT /repos/{owner}/{repo}/actions/oidc/customization/sub"
    ],
    setGithubActionsDefaultWorkflowPermissionsOrganization: [
      "PUT /orgs/{org}/actions/permissions/workflow"
    ],
    setGithubActionsDefaultWorkflowPermissionsRepository: [
      "PUT /repos/{owner}/{repo}/actions/permissions/workflow"
    ],
    setGithubActionsPermissionsOrganization: [
      "PUT /orgs/{org}/actions/permissions"
    ],
    setGithubActionsPermissionsRepository: [
      "PUT /repos/{owner}/{repo}/actions/permissions"
    ],
    setSelectedReposForOrgSecret: [
      "PUT /orgs/{org}/actions/secrets/{secret_name}/repositories"
    ],
    setSelectedReposForOrgVariable: [
      "PUT /orgs/{org}/actions/variables/{name}/repositories"
    ],
    setSelectedRepositoriesEnabledGithubActionsOrganization: [
      "PUT /orgs/{org}/actions/permissions/repositories"
    ],
    setWorkflowAccessToRepository: [
      "PUT /repos/{owner}/{repo}/actions/permissions/access"
    ],
    updateEnvironmentVariable: [
      "PATCH /repos/{owner}/{repo}/environments/{environment_name}/variables/{name}"
    ],
    updateHostedRunnerForOrg: [
      "PATCH /orgs/{org}/actions/hosted-runners/{hosted_runner_id}"
    ],
    updateOrgVariable: ["PATCH /orgs/{org}/actions/variables/{name}"],
    updateRepoVariable: [
      "PATCH /repos/{owner}/{repo}/actions/variables/{name}"
    ]
  },
  activity: {
    checkRepoIsStarredByAuthenticatedUser: ["GET /user/starred/{owner}/{repo}"],
    deleteRepoSubscription: ["DELETE /repos/{owner}/{repo}/subscription"],
    deleteThreadSubscription: [
      "DELETE /notifications/threads/{thread_id}/subscription"
    ],
    getFeeds: ["GET /feeds"],
    getRepoSubscription: ["GET /repos/{owner}/{repo}/subscription"],
    getThread: ["GET /notifications/threads/{thread_id}"],
    getThreadSubscriptionForAuthenticatedUser: [
      "GET /notifications/threads/{thread_id}/subscription"
    ],
    listEventsForAuthenticatedUser: ["GET /users/{username}/events"],
    listNotificationsForAuthenticatedUser: ["GET /notifications"],
    listOrgEventsForAuthenticatedUser: [
      "GET /users/{username}/events/orgs/{org}"
    ],
    listPublicEvents: ["GET /events"],
    listPublicEventsForRepoNetwork: ["GET /networks/{owner}/{repo}/events"],
    listPublicEventsForUser: ["GET /users/{username}/events/public"],
    listPublicOrgEvents: ["GET /orgs/{org}/events"],
    listReceivedEventsForUser: ["GET /users/{username}/received_events"],
    listReceivedPublicEventsForUser: [
      "GET /users/{username}/received_events/public"
    ],
    listRepoEvents: ["GET /repos/{owner}/{repo}/events"],
    listRepoNotificationsForAuthenticatedUser: [
      "GET /repos/{owner}/{repo}/notifications"
    ],
    listReposStarredByAuthenticatedUser: ["GET /user/starred"],
    listReposStarredByUser: ["GET /users/{username}/starred"],
    listReposWatchedByUser: ["GET /users/{username}/subscriptions"],
    listStargazersForRepo: ["GET /repos/{owner}/{repo}/stargazers"],
    listWatchedReposForAuthenticatedUser: ["GET /user/subscriptions"],
    listWatchersForRepo: ["GET /repos/{owner}/{repo}/subscribers"],
    markNotificationsAsRead: ["PUT /notifications"],
    markRepoNotificationsAsRead: ["PUT /repos/{owner}/{repo}/notifications"],
    markThreadAsDone: ["DELETE /notifications/threads/{thread_id}"],
    markThreadAsRead: ["PATCH /notifications/threads/{thread_id}"],
    setRepoSubscription: ["PUT /repos/{owner}/{repo}/subscription"],
    setThreadSubscription: [
      "PUT /notifications/threads/{thread_id}/subscription"
    ],
    starRepoForAuthenticatedUser: ["PUT /user/starred/{owner}/{repo}"],
    unstarRepoForAuthenticatedUser: ["DELETE /user/starred/{owner}/{repo}"]
  },
  apps: {
    addRepoToInstallation: [
      "PUT /user/installations/{installation_id}/repositories/{repository_id}",
      {},
      { renamed: ["apps", "addRepoToInstallationForAuthenticatedUser"] }
    ],
    addRepoToInstallationForAuthenticatedUser: [
      "PUT /user/installations/{installation_id}/repositories/{repository_id}"
    ],
    checkToken: ["POST /applications/{client_id}/token"],
    createFromManifest: ["POST /app-manifests/{code}/conversions"],
    createInstallationAccessToken: [
      "POST /app/installations/{installation_id}/access_tokens"
    ],
    deleteAuthorization: ["DELETE /applications/{client_id}/grant"],
    deleteInstallation: ["DELETE /app/installations/{installation_id}"],
    deleteToken: ["DELETE /applications/{client_id}/token"],
    getAuthenticated: ["GET /app"],
    getBySlug: ["GET /apps/{app_slug}"],
    getInstallation: ["GET /app/installations/{installation_id}"],
    getOrgInstallation: ["GET /orgs/{org}/installation"],
    getRepoInstallation: ["GET /repos/{owner}/{repo}/installation"],
    getSubscriptionPlanForAccount: [
      "GET /marketplace_listing/accounts/{account_id}"
    ],
    getSubscriptionPlanForAccountStubbed: [
      "GET /marketplace_listing/stubbed/accounts/{account_id}"
    ],
    getUserInstallation: ["GET /users/{username}/installation"],
    getWebhookConfigForApp: ["GET /app/hook/config"],
    getWebhookDelivery: ["GET /app/hook/deliveries/{delivery_id}"],
    listAccountsForPlan: ["GET /marketplace_listing/plans/{plan_id}/accounts"],
    listAccountsForPlanStubbed: [
      "GET /marketplace_listing/stubbed/plans/{plan_id}/accounts"
    ],
    listInstallationReposForAuthenticatedUser: [
      "GET /user/installations/{installation_id}/repositories"
    ],
    listInstallationRequestsForAuthenticatedApp: [
      "GET /app/installation-requests"
    ],
    listInstallations: ["GET /app/installations"],
    listInstallationsForAuthenticatedUser: ["GET /user/installations"],
    listPlans: ["GET /marketplace_listing/plans"],
    listPlansStubbed: ["GET /marketplace_listing/stubbed/plans"],
    listReposAccessibleToInstallation: ["GET /installation/repositories"],
    listSubscriptionsForAuthenticatedUser: ["GET /user/marketplace_purchases"],
    listSubscriptionsForAuthenticatedUserStubbed: [
      "GET /user/marketplace_purchases/stubbed"
    ],
    listWebhookDeliveries: ["GET /app/hook/deliveries"],
    redeliverWebhookDelivery: [
      "POST /app/hook/deliveries/{delivery_id}/attempts"
    ],
    removeRepoFromInstallation: [
      "DELETE /user/installations/{installation_id}/repositories/{repository_id}",
      {},
      { renamed: ["apps", "removeRepoFromInstallationForAuthenticatedUser"] }
    ],
    removeRepoFromInstallationForAuthenticatedUser: [
      "DELETE /user/installations/{installation_id}/repositories/{repository_id}"
    ],
    resetToken: ["PATCH /applications/{client_id}/token"],
    revokeInstallationAccessToken: ["DELETE /installation/token"],
    scopeToken: ["POST /applications/{client_id}/token/scoped"],
    suspendInstallation: ["PUT /app/installations/{installation_id}/suspended"],
    unsuspendInstallation: [
      "DELETE /app/installations/{installation_id}/suspended"
    ],
    updateWebhookConfigForApp: ["PATCH /app/hook/config"]
  },
  billing: {
    getGithubActionsBillingOrg: ["GET /orgs/{org}/settings/billing/actions"],
    getGithubActionsBillingUser: [
      "GET /users/{username}/settings/billing/actions"
    ],
    getGithubBillingPremiumRequestUsageReportOrg: [
      "GET /organizations/{org}/settings/billing/premium_request/usage"
    ],
    getGithubBillingPremiumRequestUsageReportUser: [
      "GET /users/{username}/settings/billing/premium_request/usage"
    ],
    getGithubBillingUsageReportOrg: [
      "GET /organizations/{org}/settings/billing/usage"
    ],
    getGithubBillingUsageReportUser: [
      "GET /users/{username}/settings/billing/usage"
    ],
    getGithubPackagesBillingOrg: ["GET /orgs/{org}/settings/billing/packages"],
    getGithubPackagesBillingUser: [
      "GET /users/{username}/settings/billing/packages"
    ],
    getSharedStorageBillingOrg: [
      "GET /orgs/{org}/settings/billing/shared-storage"
    ],
    getSharedStorageBillingUser: [
      "GET /users/{username}/settings/billing/shared-storage"
    ]
  },
  campaigns: {
    createCampaign: ["POST /orgs/{org}/campaigns"],
    deleteCampaign: ["DELETE /orgs/{org}/campaigns/{campaign_number}"],
    getCampaignSummary: ["GET /orgs/{org}/campaigns/{campaign_number}"],
    listOrgCampaigns: ["GET /orgs/{org}/campaigns"],
    updateCampaign: ["PATCH /orgs/{org}/campaigns/{campaign_number}"]
  },
  checks: {
    create: ["POST /repos/{owner}/{repo}/check-runs"],
    createSuite: ["POST /repos/{owner}/{repo}/check-suites"],
    get: ["GET /repos/{owner}/{repo}/check-runs/{check_run_id}"],
    getSuite: ["GET /repos/{owner}/{repo}/check-suites/{check_suite_id}"],
    listAnnotations: [
      "GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations"
    ],
    listForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-runs"],
    listForSuite: [
      "GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs"
    ],
    listSuitesForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-suites"],
    rerequestRun: [
      "POST /repos/{owner}/{repo}/check-runs/{check_run_id}/rerequest"
    ],
    rerequestSuite: [
      "POST /repos/{owner}/{repo}/check-suites/{check_suite_id}/rerequest"
    ],
    setSuitesPreferences: [
      "PATCH /repos/{owner}/{repo}/check-suites/preferences"
    ],
    update: ["PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}"]
  },
  codeScanning: {
    commitAutofix: [
      "POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix/commits"
    ],
    createAutofix: [
      "POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix"
    ],
    createVariantAnalysis: [
      "POST /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses"
    ],
    deleteAnalysis: [
      "DELETE /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}{?confirm_delete}"
    ],
    deleteCodeqlDatabase: [
      "DELETE /repos/{owner}/{repo}/code-scanning/codeql/databases/{language}"
    ],
    getAlert: [
      "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}",
      {},
      { renamedParameters: { alert_id: "alert_number" } }
    ],
    getAnalysis: [
      "GET /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}"
    ],
    getAutofix: [
      "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix"
    ],
    getCodeqlDatabase: [
      "GET /repos/{owner}/{repo}/code-scanning/codeql/databases/{language}"
    ],
    getDefaultSetup: ["GET /repos/{owner}/{repo}/code-scanning/default-setup"],
    getSarif: ["GET /repos/{owner}/{repo}/code-scanning/sarifs/{sarif_id}"],
    getVariantAnalysis: [
      "GET /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses/{codeql_variant_analysis_id}"
    ],
    getVariantAnalysisRepoTask: [
      "GET /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses/{codeql_variant_analysis_id}/repos/{repo_owner}/{repo_name}"
    ],
    listAlertInstances: [
      "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances"
    ],
    listAlertsForOrg: ["GET /orgs/{org}/code-scanning/alerts"],
    listAlertsForRepo: ["GET /repos/{owner}/{repo}/code-scanning/alerts"],
    listAlertsInstances: [
      "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances",
      {},
      { renamed: ["codeScanning", "listAlertInstances"] }
    ],
    listCodeqlDatabases: [
      "GET /repos/{owner}/{repo}/code-scanning/codeql/databases"
    ],
    listRecentAnalyses: ["GET /repos/{owner}/{repo}/code-scanning/analyses"],
    updateAlert: [
      "PATCH /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}"
    ],
    updateDefaultSetup: [
      "PATCH /repos/{owner}/{repo}/code-scanning/default-setup"
    ],
    uploadSarif: ["POST /repos/{owner}/{repo}/code-scanning/sarifs"]
  },
  codeSecurity: {
    attachConfiguration: [
      "POST /orgs/{org}/code-security/configurations/{configuration_id}/attach"
    ],
    attachEnterpriseConfiguration: [
      "POST /enterprises/{enterprise}/code-security/configurations/{configuration_id}/attach"
    ],
    createConfiguration: ["POST /orgs/{org}/code-security/configurations"],
    createConfigurationForEnterprise: [
      "POST /enterprises/{enterprise}/code-security/configurations"
    ],
    deleteConfiguration: [
      "DELETE /orgs/{org}/code-security/configurations/{configuration_id}"
    ],
    deleteConfigurationForEnterprise: [
      "DELETE /enterprises/{enterprise}/code-security/configurations/{configuration_id}"
    ],
    detachConfiguration: [
      "DELETE /orgs/{org}/code-security/configurations/detach"
    ],
    getConfiguration: [
      "GET /orgs/{org}/code-security/configurations/{configuration_id}"
    ],
    getConfigurationForRepository: [
      "GET /repos/{owner}/{repo}/code-security-configuration"
    ],
    getConfigurationsForEnterprise: [
      "GET /enterprises/{enterprise}/code-security/configurations"
    ],
    getConfigurationsForOrg: ["GET /orgs/{org}/code-security/configurations"],
    getDefaultConfigurations: [
      "GET /orgs/{org}/code-security/configurations/defaults"
    ],
    getDefaultConfigurationsForEnterprise: [
      "GET /enterprises/{enterprise}/code-security/configurations/defaults"
    ],
    getRepositoriesForConfiguration: [
      "GET /orgs/{org}/code-security/configurations/{configuration_id}/repositories"
    ],
    getRepositoriesForEnterpriseConfiguration: [
      "GET /enterprises/{enterprise}/code-security/configurations/{configuration_id}/repositories"
    ],
    getSingleConfigurationForEnterprise: [
      "GET /enterprises/{enterprise}/code-security/configurations/{configuration_id}"
    ],
    setConfigurationAsDefault: [
      "PUT /orgs/{org}/code-security/configurations/{configuration_id}/defaults"
    ],
    setConfigurationAsDefaultForEnterprise: [
      "PUT /enterprises/{enterprise}/code-security/configurations/{configuration_id}/defaults"
    ],
    updateConfiguration: [
      "PATCH /orgs/{org}/code-security/configurations/{configuration_id}"
    ],
    updateEnterpriseConfiguration: [
      "PATCH /enterprises/{enterprise}/code-security/configurations/{configuration_id}"
    ]
  },
  codesOfConduct: {
    getAllCodesOfConduct: ["GET /codes_of_conduct"],
    getConductCode: ["GET /codes_of_conduct/{key}"]
  },
  codespaces: {
    addRepositoryForSecretForAuthenticatedUser: [
      "PUT /user/codespaces/secrets/{secret_name}/repositories/{repository_id}"
    ],
    addSelectedRepoToOrgSecret: [
      "PUT /orgs/{org}/codespaces/secrets/{secret_name}/repositories/{repository_id}"
    ],
    checkPermissionsForDevcontainer: [
      "GET /repos/{owner}/{repo}/codespaces/permissions_check"
    ],
    codespaceMachinesForAuthenticatedUser: [
      "GET /user/codespaces/{codespace_name}/machines"
    ],
    createForAuthenticatedUser: ["POST /user/codespaces"],
    createOrUpdateOrgSecret: [
      "PUT /orgs/{org}/codespaces/secrets/{secret_name}"
    ],
    createOrUpdateRepoSecret: [
      "PUT /repos/{owner}/{repo}/codespaces/secrets/{secret_name}"
    ],
    createOrUpdateSecretForAuthenticatedUser: [
      "PUT /user/codespaces/secrets/{secret_name}"
    ],
    createWithPrForAuthenticatedUser: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/codespaces"
    ],
    createWithRepoForAuthenticatedUser: [
      "POST /repos/{owner}/{repo}/codespaces"
    ],
    deleteForAuthenticatedUser: ["DELETE /user/codespaces/{codespace_name}"],
    deleteFromOrganization: [
      "DELETE /orgs/{org}/members/{username}/codespaces/{codespace_name}"
    ],
    deleteOrgSecret: ["DELETE /orgs/{org}/codespaces/secrets/{secret_name}"],
    deleteRepoSecret: [
      "DELETE /repos/{owner}/{repo}/codespaces/secrets/{secret_name}"
    ],
    deleteSecretForAuthenticatedUser: [
      "DELETE /user/codespaces/secrets/{secret_name}"
    ],
    exportForAuthenticatedUser: [
      "POST /user/codespaces/{codespace_name}/exports"
    ],
    getCodespacesForUserInOrg: [
      "GET /orgs/{org}/members/{username}/codespaces"
    ],
    getExportDetailsForAuthenticatedUser: [
      "GET /user/codespaces/{codespace_name}/exports/{export_id}"
    ],
    getForAuthenticatedUser: ["GET /user/codespaces/{codespace_name}"],
    getOrgPublicKey: ["GET /orgs/{org}/codespaces/secrets/public-key"],
    getOrgSecret: ["GET /orgs/{org}/codespaces/secrets/{secret_name}"],
    getPublicKeyForAuthenticatedUser: [
      "GET /user/codespaces/secrets/public-key"
    ],
    getRepoPublicKey: [
      "GET /repos/{owner}/{repo}/codespaces/secrets/public-key"
    ],
    getRepoSecret: [
      "GET /repos/{owner}/{repo}/codespaces/secrets/{secret_name}"
    ],
    getSecretForAuthenticatedUser: [
      "GET /user/codespaces/secrets/{secret_name}"
    ],
    listDevcontainersInRepositoryForAuthenticatedUser: [
      "GET /repos/{owner}/{repo}/codespaces/devcontainers"
    ],
    listForAuthenticatedUser: ["GET /user/codespaces"],
    listInOrganization: [
      "GET /orgs/{org}/codespaces",
      {},
      { renamedParameters: { org_id: "org" } }
    ],
    listInRepositoryForAuthenticatedUser: [
      "GET /repos/{owner}/{repo}/codespaces"
    ],
    listOrgSecrets: ["GET /orgs/{org}/codespaces/secrets"],
    listRepoSecrets: ["GET /repos/{owner}/{repo}/codespaces/secrets"],
    listRepositoriesForSecretForAuthenticatedUser: [
      "GET /user/codespaces/secrets/{secret_name}/repositories"
    ],
    listSecretsForAuthenticatedUser: ["GET /user/codespaces/secrets"],
    listSelectedReposForOrgSecret: [
      "GET /orgs/{org}/codespaces/secrets/{secret_name}/repositories"
    ],
    preFlightWithRepoForAuthenticatedUser: [
      "GET /repos/{owner}/{repo}/codespaces/new"
    ],
    publishForAuthenticatedUser: [
      "POST /user/codespaces/{codespace_name}/publish"
    ],
    removeRepositoryForSecretForAuthenticatedUser: [
      "DELETE /user/codespaces/secrets/{secret_name}/repositories/{repository_id}"
    ],
    removeSelectedRepoFromOrgSecret: [
      "DELETE /orgs/{org}/codespaces/secrets/{secret_name}/repositories/{repository_id}"
    ],
    repoMachinesForAuthenticatedUser: [
      "GET /repos/{owner}/{repo}/codespaces/machines"
    ],
    setRepositoriesForSecretForAuthenticatedUser: [
      "PUT /user/codespaces/secrets/{secret_name}/repositories"
    ],
    setSelectedReposForOrgSecret: [
      "PUT /orgs/{org}/codespaces/secrets/{secret_name}/repositories"
    ],
    startForAuthenticatedUser: ["POST /user/codespaces/{codespace_name}/start"],
    stopForAuthenticatedUser: ["POST /user/codespaces/{codespace_name}/stop"],
    stopInOrganization: [
      "POST /orgs/{org}/members/{username}/codespaces/{codespace_name}/stop"
    ],
    updateForAuthenticatedUser: ["PATCH /user/codespaces/{codespace_name}"]
  },
  copilot: {
    addCopilotSeatsForTeams: [
      "POST /orgs/{org}/copilot/billing/selected_teams"
    ],
    addCopilotSeatsForUsers: [
      "POST /orgs/{org}/copilot/billing/selected_users"
    ],
    cancelCopilotSeatAssignmentForTeams: [
      "DELETE /orgs/{org}/copilot/billing/selected_teams"
    ],
    cancelCopilotSeatAssignmentForUsers: [
      "DELETE /orgs/{org}/copilot/billing/selected_users"
    ],
    copilotMetricsForOrganization: ["GET /orgs/{org}/copilot/metrics"],
    copilotMetricsForTeam: ["GET /orgs/{org}/team/{team_slug}/copilot/metrics"],
    getCopilotOrganizationDetails: ["GET /orgs/{org}/copilot/billing"],
    getCopilotSeatDetailsForUser: [
      "GET /orgs/{org}/members/{username}/copilot"
    ],
    listCopilotSeats: ["GET /orgs/{org}/copilot/billing/seats"]
  },
  credentials: { revoke: ["POST /credentials/revoke"] },
  dependabot: {
    addSelectedRepoToOrgSecret: [
      "PUT /orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id}"
    ],
    createOrUpdateOrgSecret: [
      "PUT /orgs/{org}/dependabot/secrets/{secret_name}"
    ],
    createOrUpdateRepoSecret: [
      "PUT /repos/{owner}/{repo}/dependabot/secrets/{secret_name}"
    ],
    deleteOrgSecret: ["DELETE /orgs/{org}/dependabot/secrets/{secret_name}"],
    deleteRepoSecret: [
      "DELETE /repos/{owner}/{repo}/dependabot/secrets/{secret_name}"
    ],
    getAlert: ["GET /repos/{owner}/{repo}/dependabot/alerts/{alert_number}"],
    getOrgPublicKey: ["GET /orgs/{org}/dependabot/secrets/public-key"],
    getOrgSecret: ["GET /orgs/{org}/dependabot/secrets/{secret_name}"],
    getRepoPublicKey: [
      "GET /repos/{owner}/{repo}/dependabot/secrets/public-key"
    ],
    getRepoSecret: [
      "GET /repos/{owner}/{repo}/dependabot/secrets/{secret_name}"
    ],
    listAlertsForEnterprise: [
      "GET /enterprises/{enterprise}/dependabot/alerts"
    ],
    listAlertsForOrg: ["GET /orgs/{org}/dependabot/alerts"],
    listAlertsForRepo: ["GET /repos/{owner}/{repo}/dependabot/alerts"],
    listOrgSecrets: ["GET /orgs/{org}/dependabot/secrets"],
    listRepoSecrets: ["GET /repos/{owner}/{repo}/dependabot/secrets"],
    listSelectedReposForOrgSecret: [
      "GET /orgs/{org}/dependabot/secrets/{secret_name}/repositories"
    ],
    removeSelectedRepoFromOrgSecret: [
      "DELETE /orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id}"
    ],
    repositoryAccessForOrg: [
      "GET /organizations/{org}/dependabot/repository-access"
    ],
    setRepositoryAccessDefaultLevel: [
      "PUT /organizations/{org}/dependabot/repository-access/default-level"
    ],
    setSelectedReposForOrgSecret: [
      "PUT /orgs/{org}/dependabot/secrets/{secret_name}/repositories"
    ],
    updateAlert: [
      "PATCH /repos/{owner}/{repo}/dependabot/alerts/{alert_number}"
    ],
    updateRepositoryAccessForOrg: [
      "PATCH /organizations/{org}/dependabot/repository-access"
    ]
  },
  dependencyGraph: {
    createRepositorySnapshot: [
      "POST /repos/{owner}/{repo}/dependency-graph/snapshots"
    ],
    diffRange: [
      "GET /repos/{owner}/{repo}/dependency-graph/compare/{basehead}"
    ],
    exportSbom: ["GET /repos/{owner}/{repo}/dependency-graph/sbom"]
  },
  emojis: { get: ["GET /emojis"] },
  enterpriseTeamMemberships: {
    add: [
      "PUT /enterprises/{enterprise}/teams/{enterprise-team}/memberships/{username}"
    ],
    bulkAdd: [
      "POST /enterprises/{enterprise}/teams/{enterprise-team}/memberships/add"
    ],
    bulkRemove: [
      "POST /enterprises/{enterprise}/teams/{enterprise-team}/memberships/remove"
    ],
    get: [
      "GET /enterprises/{enterprise}/teams/{enterprise-team}/memberships/{username}"
    ],
    list: ["GET /enterprises/{enterprise}/teams/{enterprise-team}/memberships"],
    remove: [
      "DELETE /enterprises/{enterprise}/teams/{enterprise-team}/memberships/{username}"
    ]
  },
  enterpriseTeamOrganizations: {
    add: [
      "PUT /enterprises/{enterprise}/teams/{enterprise-team}/organizations/{org}"
    ],
    bulkAdd: [
      "POST /enterprises/{enterprise}/teams/{enterprise-team}/organizations/add"
    ],
    bulkRemove: [
      "POST /enterprises/{enterprise}/teams/{enterprise-team}/organizations/remove"
    ],
    delete: [
      "DELETE /enterprises/{enterprise}/teams/{enterprise-team}/organizations/{org}"
    ],
    getAssignment: [
      "GET /enterprises/{enterprise}/teams/{enterprise-team}/organizations/{org}"
    ],
    getAssignments: [
      "GET /enterprises/{enterprise}/teams/{enterprise-team}/organizations"
    ]
  },
  enterpriseTeams: {
    create: ["POST /enterprises/{enterprise}/teams"],
    delete: ["DELETE /enterprises/{enterprise}/teams/{team_slug}"],
    get: ["GET /enterprises/{enterprise}/teams/{team_slug}"],
    list: ["GET /enterprises/{enterprise}/teams"],
    update: ["PATCH /enterprises/{enterprise}/teams/{team_slug}"]
  },
  gists: {
    checkIsStarred: ["GET /gists/{gist_id}/star"],
    create: ["POST /gists"],
    createComment: ["POST /gists/{gist_id}/comments"],
    delete: ["DELETE /gists/{gist_id}"],
    deleteComment: ["DELETE /gists/{gist_id}/comments/{comment_id}"],
    fork: ["POST /gists/{gist_id}/forks"],
    get: ["GET /gists/{gist_id}"],
    getComment: ["GET /gists/{gist_id}/comments/{comment_id}"],
    getRevision: ["GET /gists/{gist_id}/{sha}"],
    list: ["GET /gists"],
    listComments: ["GET /gists/{gist_id}/comments"],
    listCommits: ["GET /gists/{gist_id}/commits"],
    listForUser: ["GET /users/{username}/gists"],
    listForks: ["GET /gists/{gist_id}/forks"],
    listPublic: ["GET /gists/public"],
    listStarred: ["GET /gists/starred"],
    star: ["PUT /gists/{gist_id}/star"],
    unstar: ["DELETE /gists/{gist_id}/star"],
    update: ["PATCH /gists/{gist_id}"],
    updateComment: ["PATCH /gists/{gist_id}/comments/{comment_id}"]
  },
  git: {
    createBlob: ["POST /repos/{owner}/{repo}/git/blobs"],
    createCommit: ["POST /repos/{owner}/{repo}/git/commits"],
    createRef: ["POST /repos/{owner}/{repo}/git/refs"],
    createTag: ["POST /repos/{owner}/{repo}/git/tags"],
    createTree: ["POST /repos/{owner}/{repo}/git/trees"],
    deleteRef: ["DELETE /repos/{owner}/{repo}/git/refs/{ref}"],
    getBlob: ["GET /repos/{owner}/{repo}/git/blobs/{file_sha}"],
    getCommit: ["GET /repos/{owner}/{repo}/git/commits/{commit_sha}"],
    getRef: ["GET /repos/{owner}/{repo}/git/ref/{ref}"],
    getTag: ["GET /repos/{owner}/{repo}/git/tags/{tag_sha}"],
    getTree: ["GET /repos/{owner}/{repo}/git/trees/{tree_sha}"],
    listMatchingRefs: ["GET /repos/{owner}/{repo}/git/matching-refs/{ref}"],
    updateRef: ["PATCH /repos/{owner}/{repo}/git/refs/{ref}"]
  },
  gitignore: {
    getAllTemplates: ["GET /gitignore/templates"],
    getTemplate: ["GET /gitignore/templates/{name}"]
  },
  hostedCompute: {
    createNetworkConfigurationForOrg: [
      "POST /orgs/{org}/settings/network-configurations"
    ],
    deleteNetworkConfigurationFromOrg: [
      "DELETE /orgs/{org}/settings/network-configurations/{network_configuration_id}"
    ],
    getNetworkConfigurationForOrg: [
      "GET /orgs/{org}/settings/network-configurations/{network_configuration_id}"
    ],
    getNetworkSettingsForOrg: [
      "GET /orgs/{org}/settings/network-settings/{network_settings_id}"
    ],
    listNetworkConfigurationsForOrg: [
      "GET /orgs/{org}/settings/network-configurations"
    ],
    updateNetworkConfigurationForOrg: [
      "PATCH /orgs/{org}/settings/network-configurations/{network_configuration_id}"
    ]
  },
  interactions: {
    getRestrictionsForAuthenticatedUser: ["GET /user/interaction-limits"],
    getRestrictionsForOrg: ["GET /orgs/{org}/interaction-limits"],
    getRestrictionsForRepo: ["GET /repos/{owner}/{repo}/interaction-limits"],
    getRestrictionsForYourPublicRepos: [
      "GET /user/interaction-limits",
      {},
      { renamed: ["interactions", "getRestrictionsForAuthenticatedUser"] }
    ],
    removeRestrictionsForAuthenticatedUser: ["DELETE /user/interaction-limits"],
    removeRestrictionsForOrg: ["DELETE /orgs/{org}/interaction-limits"],
    removeRestrictionsForRepo: [
      "DELETE /repos/{owner}/{repo}/interaction-limits"
    ],
    removeRestrictionsForYourPublicRepos: [
      "DELETE /user/interaction-limits",
      {},
      { renamed: ["interactions", "removeRestrictionsForAuthenticatedUser"] }
    ],
    setRestrictionsForAuthenticatedUser: ["PUT /user/interaction-limits"],
    setRestrictionsForOrg: ["PUT /orgs/{org}/interaction-limits"],
    setRestrictionsForRepo: ["PUT /repos/{owner}/{repo}/interaction-limits"],
    setRestrictionsForYourPublicRepos: [
      "PUT /user/interaction-limits",
      {},
      { renamed: ["interactions", "setRestrictionsForAuthenticatedUser"] }
    ]
  },
  issues: {
    addAssignees: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/assignees"
    ],
    addBlockedByDependency: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by"
    ],
    addLabels: ["POST /repos/{owner}/{repo}/issues/{issue_number}/labels"],
    addSubIssue: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/sub_issues"
    ],
    checkUserCanBeAssigned: ["GET /repos/{owner}/{repo}/assignees/{assignee}"],
    checkUserCanBeAssignedToIssue: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/assignees/{assignee}"
    ],
    create: ["POST /repos/{owner}/{repo}/issues"],
    createComment: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/comments"
    ],
    createLabel: ["POST /repos/{owner}/{repo}/labels"],
    createMilestone: ["POST /repos/{owner}/{repo}/milestones"],
    deleteComment: [
      "DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}"
    ],
    deleteLabel: ["DELETE /repos/{owner}/{repo}/labels/{name}"],
    deleteMilestone: [
      "DELETE /repos/{owner}/{repo}/milestones/{milestone_number}"
    ],
    get: ["GET /repos/{owner}/{repo}/issues/{issue_number}"],
    getComment: ["GET /repos/{owner}/{repo}/issues/comments/{comment_id}"],
    getEvent: ["GET /repos/{owner}/{repo}/issues/events/{event_id}"],
    getLabel: ["GET /repos/{owner}/{repo}/labels/{name}"],
    getMilestone: ["GET /repos/{owner}/{repo}/milestones/{milestone_number}"],
    getParent: ["GET /repos/{owner}/{repo}/issues/{issue_number}/parent"],
    list: ["GET /issues"],
    listAssignees: ["GET /repos/{owner}/{repo}/assignees"],
    listComments: ["GET /repos/{owner}/{repo}/issues/{issue_number}/comments"],
    listCommentsForRepo: ["GET /repos/{owner}/{repo}/issues/comments"],
    listDependenciesBlockedBy: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by"
    ],
    listDependenciesBlocking: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocking"
    ],
    listEvents: ["GET /repos/{owner}/{repo}/issues/{issue_number}/events"],
    listEventsForRepo: ["GET /repos/{owner}/{repo}/issues/events"],
    listEventsForTimeline: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/timeline"
    ],
    listForAuthenticatedUser: ["GET /user/issues"],
    listForOrg: ["GET /orgs/{org}/issues"],
    listForRepo: ["GET /repos/{owner}/{repo}/issues"],
    listLabelsForMilestone: [
      "GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels"
    ],
    listLabelsForRepo: ["GET /repos/{owner}/{repo}/labels"],
    listLabelsOnIssue: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/labels"
    ],
    listMilestones: ["GET /repos/{owner}/{repo}/milestones"],
    listSubIssues: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/sub_issues"
    ],
    lock: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/lock"],
    removeAllLabels: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels"
    ],
    removeAssignees: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/assignees"
    ],
    removeDependencyBlockedBy: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by/{issue_id}"
    ],
    removeLabel: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}"
    ],
    removeSubIssue: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/sub_issue"
    ],
    reprioritizeSubIssue: [
      "PATCH /repos/{owner}/{repo}/issues/{issue_number}/sub_issues/priority"
    ],
    setLabels: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/labels"],
    unlock: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/lock"],
    update: ["PATCH /repos/{owner}/{repo}/issues/{issue_number}"],
    updateComment: ["PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}"],
    updateLabel: ["PATCH /repos/{owner}/{repo}/labels/{name}"],
    updateMilestone: [
      "PATCH /repos/{owner}/{repo}/milestones/{milestone_number}"
    ]
  },
  licenses: {
    get: ["GET /licenses/{license}"],
    getAllCommonlyUsed: ["GET /licenses"],
    getForRepo: ["GET /repos/{owner}/{repo}/license"]
  },
  markdown: {
    render: ["POST /markdown"],
    renderRaw: [
      "POST /markdown/raw",
      { headers: { "content-type": "text/plain; charset=utf-8" } }
    ]
  },
  meta: {
    get: ["GET /meta"],
    getAllVersions: ["GET /versions"],
    getOctocat: ["GET /octocat"],
    getZen: ["GET /zen"],
    root: ["GET /"]
  },
  migrations: {
    deleteArchiveForAuthenticatedUser: [
      "DELETE /user/migrations/{migration_id}/archive"
    ],
    deleteArchiveForOrg: [
      "DELETE /orgs/{org}/migrations/{migration_id}/archive"
    ],
    downloadArchiveForOrg: [
      "GET /orgs/{org}/migrations/{migration_id}/archive"
    ],
    getArchiveForAuthenticatedUser: [
      "GET /user/migrations/{migration_id}/archive"
    ],
    getStatusForAuthenticatedUser: ["GET /user/migrations/{migration_id}"],
    getStatusForOrg: ["GET /orgs/{org}/migrations/{migration_id}"],
    listForAuthenticatedUser: ["GET /user/migrations"],
    listForOrg: ["GET /orgs/{org}/migrations"],
    listReposForAuthenticatedUser: [
      "GET /user/migrations/{migration_id}/repositories"
    ],
    listReposForOrg: ["GET /orgs/{org}/migrations/{migration_id}/repositories"],
    listReposForUser: [
      "GET /user/migrations/{migration_id}/repositories",
      {},
      { renamed: ["migrations", "listReposForAuthenticatedUser"] }
    ],
    startForAuthenticatedUser: ["POST /user/migrations"],
    startForOrg: ["POST /orgs/{org}/migrations"],
    unlockRepoForAuthenticatedUser: [
      "DELETE /user/migrations/{migration_id}/repos/{repo_name}/lock"
    ],
    unlockRepoForOrg: [
      "DELETE /orgs/{org}/migrations/{migration_id}/repos/{repo_name}/lock"
    ]
  },
  oidc: {
    getOidcCustomSubTemplateForOrg: [
      "GET /orgs/{org}/actions/oidc/customization/sub"
    ],
    updateOidcCustomSubTemplateForOrg: [
      "PUT /orgs/{org}/actions/oidc/customization/sub"
    ]
  },
  orgs: {
    addSecurityManagerTeam: [
      "PUT /orgs/{org}/security-managers/teams/{team_slug}",
      {},
      {
        deprecated: "octokit.rest.orgs.addSecurityManagerTeam() is deprecated, see https://docs.github.com/rest/orgs/security-managers#add-a-security-manager-team"
      }
    ],
    assignTeamToOrgRole: [
      "PUT /orgs/{org}/organization-roles/teams/{team_slug}/{role_id}"
    ],
    assignUserToOrgRole: [
      "PUT /orgs/{org}/organization-roles/users/{username}/{role_id}"
    ],
    blockUser: ["PUT /orgs/{org}/blocks/{username}"],
    cancelInvitation: ["DELETE /orgs/{org}/invitations/{invitation_id}"],
    checkBlockedUser: ["GET /orgs/{org}/blocks/{username}"],
    checkMembershipForUser: ["GET /orgs/{org}/members/{username}"],
    checkPublicMembershipForUser: ["GET /orgs/{org}/public_members/{username}"],
    convertMemberToOutsideCollaborator: [
      "PUT /orgs/{org}/outside_collaborators/{username}"
    ],
    createArtifactStorageRecord: [
      "POST /orgs/{org}/artifacts/metadata/storage-record"
    ],
    createInvitation: ["POST /orgs/{org}/invitations"],
    createIssueType: ["POST /orgs/{org}/issue-types"],
    createWebhook: ["POST /orgs/{org}/hooks"],
    customPropertiesForOrgsCreateOrUpdateOrganizationValues: [
      "PATCH /organizations/{org}/org-properties/values"
    ],
    customPropertiesForOrgsGetOrganizationValues: [
      "GET /organizations/{org}/org-properties/values"
    ],
    customPropertiesForReposCreateOrUpdateOrganizationDefinition: [
      "PUT /orgs/{org}/properties/schema/{custom_property_name}"
    ],
    customPropertiesForReposCreateOrUpdateOrganizationDefinitions: [
      "PATCH /orgs/{org}/properties/schema"
    ],
    customPropertiesForReposCreateOrUpdateOrganizationValues: [
      "PATCH /orgs/{org}/properties/values"
    ],
    customPropertiesForReposDeleteOrganizationDefinition: [
      "DELETE /orgs/{org}/properties/schema/{custom_property_name}"
    ],
    customPropertiesForReposGetOrganizationDefinition: [
      "GET /orgs/{org}/properties/schema/{custom_property_name}"
    ],
    customPropertiesForReposGetOrganizationDefinitions: [
      "GET /orgs/{org}/properties/schema"
    ],
    customPropertiesForReposGetOrganizationValues: [
      "GET /orgs/{org}/properties/values"
    ],
    delete: ["DELETE /orgs/{org}"],
    deleteAttestationsBulk: ["POST /orgs/{org}/attestations/delete-request"],
    deleteAttestationsById: [
      "DELETE /orgs/{org}/attestations/{attestation_id}"
    ],
    deleteAttestationsBySubjectDigest: [
      "DELETE /orgs/{org}/attestations/digest/{subject_digest}"
    ],
    deleteIssueType: ["DELETE /orgs/{org}/issue-types/{issue_type_id}"],
    deleteWebhook: ["DELETE /orgs/{org}/hooks/{hook_id}"],
    disableSelectedRepositoryImmutableReleasesOrganization: [
      "DELETE /orgs/{org}/settings/immutable-releases/repositories/{repository_id}"
    ],
    enableSelectedRepositoryImmutableReleasesOrganization: [
      "PUT /orgs/{org}/settings/immutable-releases/repositories/{repository_id}"
    ],
    get: ["GET /orgs/{org}"],
    getImmutableReleasesSettings: [
      "GET /orgs/{org}/settings/immutable-releases"
    ],
    getImmutableReleasesSettingsRepositories: [
      "GET /orgs/{org}/settings/immutable-releases/repositories"
    ],
    getMembershipForAuthenticatedUser: ["GET /user/memberships/orgs/{org}"],
    getMembershipForUser: ["GET /orgs/{org}/memberships/{username}"],
    getOrgRole: ["GET /orgs/{org}/organization-roles/{role_id}"],
    getOrgRulesetHistory: ["GET /orgs/{org}/rulesets/{ruleset_id}/history"],
    getOrgRulesetVersion: [
      "GET /orgs/{org}/rulesets/{ruleset_id}/history/{version_id}"
    ],
    getWebhook: ["GET /orgs/{org}/hooks/{hook_id}"],
    getWebhookConfigForOrg: ["GET /orgs/{org}/hooks/{hook_id}/config"],
    getWebhookDelivery: [
      "GET /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}"
    ],
    list: ["GET /organizations"],
    listAppInstallations: ["GET /orgs/{org}/installations"],
    listArtifactStorageRecords: [
      "GET /orgs/{org}/artifacts/{subject_digest}/metadata/storage-records"
    ],
    listAttestationRepositories: ["GET /orgs/{org}/attestations/repositories"],
    listAttestations: ["GET /orgs/{org}/attestations/{subject_digest}"],
    listAttestationsBulk: [
      "POST /orgs/{org}/attestations/bulk-list{?per_page,before,after}"
    ],
    listBlockedUsers: ["GET /orgs/{org}/blocks"],
    listFailedInvitations: ["GET /orgs/{org}/failed_invitations"],
    listForAuthenticatedUser: ["GET /user/orgs"],
    listForUser: ["GET /users/{username}/orgs"],
    listInvitationTeams: ["GET /orgs/{org}/invitations/{invitation_id}/teams"],
    listIssueTypes: ["GET /orgs/{org}/issue-types"],
    listMembers: ["GET /orgs/{org}/members"],
    listMembershipsForAuthenticatedUser: ["GET /user/memberships/orgs"],
    listOrgRoleTeams: ["GET /orgs/{org}/organization-roles/{role_id}/teams"],
    listOrgRoleUsers: ["GET /orgs/{org}/organization-roles/{role_id}/users"],
    listOrgRoles: ["GET /orgs/{org}/organization-roles"],
    listOrganizationFineGrainedPermissions: [
      "GET /orgs/{org}/organization-fine-grained-permissions"
    ],
    listOutsideCollaborators: ["GET /orgs/{org}/outside_collaborators"],
    listPatGrantRepositories: [
      "GET /orgs/{org}/personal-access-tokens/{pat_id}/repositories"
    ],
    listPatGrantRequestRepositories: [
      "GET /orgs/{org}/personal-access-token-requests/{pat_request_id}/repositories"
    ],
    listPatGrantRequests: ["GET /orgs/{org}/personal-access-token-requests"],
    listPatGrants: ["GET /orgs/{org}/personal-access-tokens"],
    listPendingInvitations: ["GET /orgs/{org}/invitations"],
    listPublicMembers: ["GET /orgs/{org}/public_members"],
    listSecurityManagerTeams: [
      "GET /orgs/{org}/security-managers",
      {},
      {
        deprecated: "octokit.rest.orgs.listSecurityManagerTeams() is deprecated, see https://docs.github.com/rest/orgs/security-managers#list-security-manager-teams"
      }
    ],
    listWebhookDeliveries: ["GET /orgs/{org}/hooks/{hook_id}/deliveries"],
    listWebhooks: ["GET /orgs/{org}/hooks"],
    pingWebhook: ["POST /orgs/{org}/hooks/{hook_id}/pings"],
    redeliverWebhookDelivery: [
      "POST /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}/attempts"
    ],
    removeMember: ["DELETE /orgs/{org}/members/{username}"],
    removeMembershipForUser: ["DELETE /orgs/{org}/memberships/{username}"],
    removeOutsideCollaborator: [
      "DELETE /orgs/{org}/outside_collaborators/{username}"
    ],
    removePublicMembershipForAuthenticatedUser: [
      "DELETE /orgs/{org}/public_members/{username}"
    ],
    removeSecurityManagerTeam: [
      "DELETE /orgs/{org}/security-managers/teams/{team_slug}",
      {},
      {
        deprecated: "octokit.rest.orgs.removeSecurityManagerTeam() is deprecated, see https://docs.github.com/rest/orgs/security-managers#remove-a-security-manager-team"
      }
    ],
    reviewPatGrantRequest: [
      "POST /orgs/{org}/personal-access-token-requests/{pat_request_id}"
    ],
    reviewPatGrantRequestsInBulk: [
      "POST /orgs/{org}/personal-access-token-requests"
    ],
    revokeAllOrgRolesTeam: [
      "DELETE /orgs/{org}/organization-roles/teams/{team_slug}"
    ],
    revokeAllOrgRolesUser: [
      "DELETE /orgs/{org}/organization-roles/users/{username}"
    ],
    revokeOrgRoleTeam: [
      "DELETE /orgs/{org}/organization-roles/teams/{team_slug}/{role_id}"
    ],
    revokeOrgRoleUser: [
      "DELETE /orgs/{org}/organization-roles/users/{username}/{role_id}"
    ],
    setImmutableReleasesSettings: [
      "PUT /orgs/{org}/settings/immutable-releases"
    ],
    setImmutableReleasesSettingsRepositories: [
      "PUT /orgs/{org}/settings/immutable-releases/repositories"
    ],
    setMembershipForUser: ["PUT /orgs/{org}/memberships/{username}"],
    setPublicMembershipForAuthenticatedUser: [
      "PUT /orgs/{org}/public_members/{username}"
    ],
    unblockUser: ["DELETE /orgs/{org}/blocks/{username}"],
    update: ["PATCH /orgs/{org}"],
    updateIssueType: ["PUT /orgs/{org}/issue-types/{issue_type_id}"],
    updateMembershipForAuthenticatedUser: [
      "PATCH /user/memberships/orgs/{org}"
    ],
    updatePatAccess: ["POST /orgs/{org}/personal-access-tokens/{pat_id}"],
    updatePatAccesses: ["POST /orgs/{org}/personal-access-tokens"],
    updateWebhook: ["PATCH /orgs/{org}/hooks/{hook_id}"],
    updateWebhookConfigForOrg: ["PATCH /orgs/{org}/hooks/{hook_id}/config"]
  },
  packages: {
    deletePackageForAuthenticatedUser: [
      "DELETE /user/packages/{package_type}/{package_name}"
    ],
    deletePackageForOrg: [
      "DELETE /orgs/{org}/packages/{package_type}/{package_name}"
    ],
    deletePackageForUser: [
      "DELETE /users/{username}/packages/{package_type}/{package_name}"
    ],
    deletePackageVersionForAuthenticatedUser: [
      "DELETE /user/packages/{package_type}/{package_name}/versions/{package_version_id}"
    ],
    deletePackageVersionForOrg: [
      "DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}"
    ],
    deletePackageVersionForUser: [
      "DELETE /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}"
    ],
    getAllPackageVersionsForAPackageOwnedByAnOrg: [
      "GET /orgs/{org}/packages/{package_type}/{package_name}/versions",
      {},
      { renamed: ["packages", "getAllPackageVersionsForPackageOwnedByOrg"] }
    ],
    getAllPackageVersionsForAPackageOwnedByTheAuthenticatedUser: [
      "GET /user/packages/{package_type}/{package_name}/versions",
      {},
      {
        renamed: [
          "packages",
          "getAllPackageVersionsForPackageOwnedByAuthenticatedUser"
        ]
      }
    ],
    getAllPackageVersionsForPackageOwnedByAuthenticatedUser: [
      "GET /user/packages/{package_type}/{package_name}/versions"
    ],
    getAllPackageVersionsForPackageOwnedByOrg: [
      "GET /orgs/{org}/packages/{package_type}/{package_name}/versions"
    ],
    getAllPackageVersionsForPackageOwnedByUser: [
      "GET /users/{username}/packages/{package_type}/{package_name}/versions"
    ],
    getPackageForAuthenticatedUser: [
      "GET /user/packages/{package_type}/{package_name}"
    ],
    getPackageForOrganization: [
      "GET /orgs/{org}/packages/{package_type}/{package_name}"
    ],
    getPackageForUser: [
      "GET /users/{username}/packages/{package_type}/{package_name}"
    ],
    getPackageVersionForAuthenticatedUser: [
      "GET /user/packages/{package_type}/{package_name}/versions/{package_version_id}"
    ],
    getPackageVersionForOrganization: [
      "GET /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}"
    ],
    getPackageVersionForUser: [
      "GET /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}"
    ],
    listDockerMigrationConflictingPackagesForAuthenticatedUser: [
      "GET /user/docker/conflicts"
    ],
    listDockerMigrationConflictingPackagesForOrganization: [
      "GET /orgs/{org}/docker/conflicts"
    ],
    listDockerMigrationConflictingPackagesForUser: [
      "GET /users/{username}/docker/conflicts"
    ],
    listPackagesForAuthenticatedUser: ["GET /user/packages"],
    listPackagesForOrganization: ["GET /orgs/{org}/packages"],
    listPackagesForUser: ["GET /users/{username}/packages"],
    restorePackageForAuthenticatedUser: [
      "POST /user/packages/{package_type}/{package_name}/restore{?token}"
    ],
    restorePackageForOrg: [
      "POST /orgs/{org}/packages/{package_type}/{package_name}/restore{?token}"
    ],
    restorePackageForUser: [
      "POST /users/{username}/packages/{package_type}/{package_name}/restore{?token}"
    ],
    restorePackageVersionForAuthenticatedUser: [
      "POST /user/packages/{package_type}/{package_name}/versions/{package_version_id}/restore"
    ],
    restorePackageVersionForOrg: [
      "POST /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore"
    ],
    restorePackageVersionForUser: [
      "POST /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore"
    ]
  },
  privateRegistries: {
    createOrgPrivateRegistry: ["POST /orgs/{org}/private-registries"],
    deleteOrgPrivateRegistry: [
      "DELETE /orgs/{org}/private-registries/{secret_name}"
    ],
    getOrgPrivateRegistry: ["GET /orgs/{org}/private-registries/{secret_name}"],
    getOrgPublicKey: ["GET /orgs/{org}/private-registries/public-key"],
    listOrgPrivateRegistries: ["GET /orgs/{org}/private-registries"],
    updateOrgPrivateRegistry: [
      "PATCH /orgs/{org}/private-registries/{secret_name}"
    ]
  },
  projects: {
    addItemForOrg: ["POST /orgs/{org}/projectsV2/{project_number}/items"],
    addItemForUser: [
      "POST /users/{username}/projectsV2/{project_number}/items"
    ],
    deleteItemForOrg: [
      "DELETE /orgs/{org}/projectsV2/{project_number}/items/{item_id}"
    ],
    deleteItemForUser: [
      "DELETE /users/{username}/projectsV2/{project_number}/items/{item_id}"
    ],
    getFieldForOrg: [
      "GET /orgs/{org}/projectsV2/{project_number}/fields/{field_id}"
    ],
    getFieldForUser: [
      "GET /users/{username}/projectsV2/{project_number}/fields/{field_id}"
    ],
    getForOrg: ["GET /orgs/{org}/projectsV2/{project_number}"],
    getForUser: ["GET /users/{username}/projectsV2/{project_number}"],
    getOrgItem: ["GET /orgs/{org}/projectsV2/{project_number}/items/{item_id}"],
    getUserItem: [
      "GET /users/{username}/projectsV2/{project_number}/items/{item_id}"
    ],
    listFieldsForOrg: ["GET /orgs/{org}/projectsV2/{project_number}/fields"],
    listFieldsForUser: [
      "GET /users/{username}/projectsV2/{project_number}/fields"
    ],
    listForOrg: ["GET /orgs/{org}/projectsV2"],
    listForUser: ["GET /users/{username}/projectsV2"],
    listItemsForOrg: ["GET /orgs/{org}/projectsV2/{project_number}/items"],
    listItemsForUser: [
      "GET /users/{username}/projectsV2/{project_number}/items"
    ],
    updateItemForOrg: [
      "PATCH /orgs/{org}/projectsV2/{project_number}/items/{item_id}"
    ],
    updateItemForUser: [
      "PATCH /users/{username}/projectsV2/{project_number}/items/{item_id}"
    ]
  },
  pulls: {
    checkIfMerged: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
    create: ["POST /repos/{owner}/{repo}/pulls"],
    createReplyForReviewComment: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies"
    ],
    createReview: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews"],
    createReviewComment: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments"
    ],
    deletePendingReview: [
      "DELETE /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}"
    ],
    deleteReviewComment: [
      "DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}"
    ],
    dismissReview: [
      "PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/dismissals"
    ],
    get: ["GET /repos/{owner}/{repo}/pulls/{pull_number}"],
    getReview: [
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}"
    ],
    getReviewComment: ["GET /repos/{owner}/{repo}/pulls/comments/{comment_id}"],
    list: ["GET /repos/{owner}/{repo}/pulls"],
    listCommentsForReview: [
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments"
    ],
    listCommits: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/commits"],
    listFiles: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/files"],
    listRequestedReviewers: [
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers"
    ],
    listReviewComments: [
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/comments"
    ],
    listReviewCommentsForRepo: ["GET /repos/{owner}/{repo}/pulls/comments"],
    listReviews: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews"],
    merge: ["PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
    removeRequestedReviewers: [
      "DELETE /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers"
    ],
    requestReviewers: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers"
    ],
    submitReview: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/events"
    ],
    update: ["PATCH /repos/{owner}/{repo}/pulls/{pull_number}"],
    updateBranch: [
      "PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch"
    ],
    updateReview: [
      "PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}"
    ],
    updateReviewComment: [
      "PATCH /repos/{owner}/{repo}/pulls/comments/{comment_id}"
    ]
  },
  rateLimit: { get: ["GET /rate_limit"] },
  reactions: {
    createForCommitComment: [
      "POST /repos/{owner}/{repo}/comments/{comment_id}/reactions"
    ],
    createForIssue: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/reactions"
    ],
    createForIssueComment: [
      "POST /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions"
    ],
    createForPullRequestReviewComment: [
      "POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions"
    ],
    createForRelease: [
      "POST /repos/{owner}/{repo}/releases/{release_id}/reactions"
    ],
    createForTeamDiscussionCommentInOrg: [
      "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions"
    ],
    createForTeamDiscussionInOrg: [
      "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions"
    ],
    deleteForCommitComment: [
      "DELETE /repos/{owner}/{repo}/comments/{comment_id}/reactions/{reaction_id}"
    ],
    deleteForIssue: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/reactions/{reaction_id}"
    ],
    deleteForIssueComment: [
      "DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions/{reaction_id}"
    ],
    deleteForPullRequestComment: [
      "DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions/{reaction_id}"
    ],
    deleteForRelease: [
      "DELETE /repos/{owner}/{repo}/releases/{release_id}/reactions/{reaction_id}"
    ],
    deleteForTeamDiscussion: [
      "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions/{reaction_id}"
    ],
    deleteForTeamDiscussionComment: [
      "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions/{reaction_id}"
    ],
    listForCommitComment: [
      "GET /repos/{owner}/{repo}/comments/{comment_id}/reactions"
    ],
    listForIssue: ["GET /repos/{owner}/{repo}/issues/{issue_number}/reactions"],
    listForIssueComment: [
      "GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions"
    ],
    listForPullRequestReviewComment: [
      "GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions"
    ],
    listForRelease: [
      "GET /repos/{owner}/{repo}/releases/{release_id}/reactions"
    ],
    listForTeamDiscussionCommentInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions"
    ],
    listForTeamDiscussionInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions"
    ]
  },
  repos: {
    acceptInvitation: [
      "PATCH /user/repository_invitations/{invitation_id}",
      {},
      { renamed: ["repos", "acceptInvitationForAuthenticatedUser"] }
    ],
    acceptInvitationForAuthenticatedUser: [
      "PATCH /user/repository_invitations/{invitation_id}"
    ],
    addAppAccessRestrictions: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
      {},
      { mapToData: "apps" }
    ],
    addCollaborator: ["PUT /repos/{owner}/{repo}/collaborators/{username}"],
    addStatusCheckContexts: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
      {},
      { mapToData: "contexts" }
    ],
    addTeamAccessRestrictions: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
      {},
      { mapToData: "teams" }
    ],
    addUserAccessRestrictions: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
      {},
      { mapToData: "users" }
    ],
    cancelPagesDeployment: [
      "POST /repos/{owner}/{repo}/pages/deployments/{pages_deployment_id}/cancel"
    ],
    checkAutomatedSecurityFixes: [
      "GET /repos/{owner}/{repo}/automated-security-fixes"
    ],
    checkCollaborator: ["GET /repos/{owner}/{repo}/collaborators/{username}"],
    checkImmutableReleases: ["GET /repos/{owner}/{repo}/immutable-releases"],
    checkPrivateVulnerabilityReporting: [
      "GET /repos/{owner}/{repo}/private-vulnerability-reporting"
    ],
    checkVulnerabilityAlerts: [
      "GET /repos/{owner}/{repo}/vulnerability-alerts"
    ],
    codeownersErrors: ["GET /repos/{owner}/{repo}/codeowners/errors"],
    compareCommits: ["GET /repos/{owner}/{repo}/compare/{base}...{head}"],
    compareCommitsWithBasehead: [
      "GET /repos/{owner}/{repo}/compare/{basehead}"
    ],
    createAttestation: ["POST /repos/{owner}/{repo}/attestations"],
    createAutolink: ["POST /repos/{owner}/{repo}/autolinks"],
    createCommitComment: [
      "POST /repos/{owner}/{repo}/commits/{commit_sha}/comments"
    ],
    createCommitSignatureProtection: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures"
    ],
    createCommitStatus: ["POST /repos/{owner}/{repo}/statuses/{sha}"],
    createDeployKey: ["POST /repos/{owner}/{repo}/keys"],
    createDeployment: ["POST /repos/{owner}/{repo}/deployments"],
    createDeploymentBranchPolicy: [
      "POST /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies"
    ],
    createDeploymentProtectionRule: [
      "POST /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules"
    ],
    createDeploymentStatus: [
      "POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses"
    ],
    createDispatchEvent: ["POST /repos/{owner}/{repo}/dispatches"],
    createForAuthenticatedUser: ["POST /user/repos"],
    createFork: ["POST /repos/{owner}/{repo}/forks"],
    createInOrg: ["POST /orgs/{org}/repos"],
    createOrUpdateEnvironment: [
      "PUT /repos/{owner}/{repo}/environments/{environment_name}"
    ],
    createOrUpdateFileContents: ["PUT /repos/{owner}/{repo}/contents/{path}"],
    createOrgRuleset: ["POST /orgs/{org}/rulesets"],
    createPagesDeployment: ["POST /repos/{owner}/{repo}/pages/deployments"],
    createPagesSite: ["POST /repos/{owner}/{repo}/pages"],
    createRelease: ["POST /repos/{owner}/{repo}/releases"],
    createRepoRuleset: ["POST /repos/{owner}/{repo}/rulesets"],
    createUsingTemplate: [
      "POST /repos/{template_owner}/{template_repo}/generate"
    ],
    createWebhook: ["POST /repos/{owner}/{repo}/hooks"],
    customPropertiesForReposCreateOrUpdateRepositoryValues: [
      "PATCH /repos/{owner}/{repo}/properties/values"
    ],
    customPropertiesForReposGetRepositoryValues: [
      "GET /repos/{owner}/{repo}/properties/values"
    ],
    declineInvitation: [
      "DELETE /user/repository_invitations/{invitation_id}",
      {},
      { renamed: ["repos", "declineInvitationForAuthenticatedUser"] }
    ],
    declineInvitationForAuthenticatedUser: [
      "DELETE /user/repository_invitations/{invitation_id}"
    ],
    delete: ["DELETE /repos/{owner}/{repo}"],
    deleteAccessRestrictions: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions"
    ],
    deleteAdminBranchProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins"
    ],
    deleteAnEnvironment: [
      "DELETE /repos/{owner}/{repo}/environments/{environment_name}"
    ],
    deleteAutolink: ["DELETE /repos/{owner}/{repo}/autolinks/{autolink_id}"],
    deleteBranchProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection"
    ],
    deleteCommitComment: ["DELETE /repos/{owner}/{repo}/comments/{comment_id}"],
    deleteCommitSignatureProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures"
    ],
    deleteDeployKey: ["DELETE /repos/{owner}/{repo}/keys/{key_id}"],
    deleteDeployment: [
      "DELETE /repos/{owner}/{repo}/deployments/{deployment_id}"
    ],
    deleteDeploymentBranchPolicy: [
      "DELETE /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}"
    ],
    deleteFile: ["DELETE /repos/{owner}/{repo}/contents/{path}"],
    deleteInvitation: [
      "DELETE /repos/{owner}/{repo}/invitations/{invitation_id}"
    ],
    deleteOrgRuleset: ["DELETE /orgs/{org}/rulesets/{ruleset_id}"],
    deletePagesSite: ["DELETE /repos/{owner}/{repo}/pages"],
    deletePullRequestReviewProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews"
    ],
    deleteRelease: ["DELETE /repos/{owner}/{repo}/releases/{release_id}"],
    deleteReleaseAsset: [
      "DELETE /repos/{owner}/{repo}/releases/assets/{asset_id}"
    ],
    deleteRepoRuleset: ["DELETE /repos/{owner}/{repo}/rulesets/{ruleset_id}"],
    deleteWebhook: ["DELETE /repos/{owner}/{repo}/hooks/{hook_id}"],
    disableAutomatedSecurityFixes: [
      "DELETE /repos/{owner}/{repo}/automated-security-fixes"
    ],
    disableDeploymentProtectionRule: [
      "DELETE /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/{protection_rule_id}"
    ],
    disableImmutableReleases: [
      "DELETE /repos/{owner}/{repo}/immutable-releases"
    ],
    disablePrivateVulnerabilityReporting: [
      "DELETE /repos/{owner}/{repo}/private-vulnerability-reporting"
    ],
    disableVulnerabilityAlerts: [
      "DELETE /repos/{owner}/{repo}/vulnerability-alerts"
    ],
    downloadArchive: [
      "GET /repos/{owner}/{repo}/zipball/{ref}",
      {},
      { renamed: ["repos", "downloadZipballArchive"] }
    ],
    downloadTarballArchive: ["GET /repos/{owner}/{repo}/tarball/{ref}"],
    downloadZipballArchive: ["GET /repos/{owner}/{repo}/zipball/{ref}"],
    enableAutomatedSecurityFixes: [
      "PUT /repos/{owner}/{repo}/automated-security-fixes"
    ],
    enableImmutableReleases: ["PUT /repos/{owner}/{repo}/immutable-releases"],
    enablePrivateVulnerabilityReporting: [
      "PUT /repos/{owner}/{repo}/private-vulnerability-reporting"
    ],
    enableVulnerabilityAlerts: [
      "PUT /repos/{owner}/{repo}/vulnerability-alerts"
    ],
    generateReleaseNotes: [
      "POST /repos/{owner}/{repo}/releases/generate-notes"
    ],
    get: ["GET /repos/{owner}/{repo}"],
    getAccessRestrictions: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions"
    ],
    getAdminBranchProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins"
    ],
    getAllDeploymentProtectionRules: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules"
    ],
    getAllEnvironments: ["GET /repos/{owner}/{repo}/environments"],
    getAllStatusCheckContexts: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts"
    ],
    getAllTopics: ["GET /repos/{owner}/{repo}/topics"],
    getAppsWithAccessToProtectedBranch: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps"
    ],
    getAutolink: ["GET /repos/{owner}/{repo}/autolinks/{autolink_id}"],
    getBranch: ["GET /repos/{owner}/{repo}/branches/{branch}"],
    getBranchProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection"
    ],
    getBranchRules: ["GET /repos/{owner}/{repo}/rules/branches/{branch}"],
    getClones: ["GET /repos/{owner}/{repo}/traffic/clones"],
    getCodeFrequencyStats: ["GET /repos/{owner}/{repo}/stats/code_frequency"],
    getCollaboratorPermissionLevel: [
      "GET /repos/{owner}/{repo}/collaborators/{username}/permission"
    ],
    getCombinedStatusForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/status"],
    getCommit: ["GET /repos/{owner}/{repo}/commits/{ref}"],
    getCommitActivityStats: ["GET /repos/{owner}/{repo}/stats/commit_activity"],
    getCommitComment: ["GET /repos/{owner}/{repo}/comments/{comment_id}"],
    getCommitSignatureProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures"
    ],
    getCommunityProfileMetrics: ["GET /repos/{owner}/{repo}/community/profile"],
    getContent: ["GET /repos/{owner}/{repo}/contents/{path}"],
    getContributorsStats: ["GET /repos/{owner}/{repo}/stats/contributors"],
    getCustomDeploymentProtectionRule: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/{protection_rule_id}"
    ],
    getDeployKey: ["GET /repos/{owner}/{repo}/keys/{key_id}"],
    getDeployment: ["GET /repos/{owner}/{repo}/deployments/{deployment_id}"],
    getDeploymentBranchPolicy: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}"
    ],
    getDeploymentStatus: [
      "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses/{status_id}"
    ],
    getEnvironment: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}"
    ],
    getLatestPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/latest"],
    getLatestRelease: ["GET /repos/{owner}/{repo}/releases/latest"],
    getOrgRuleSuite: ["GET /orgs/{org}/rulesets/rule-suites/{rule_suite_id}"],
    getOrgRuleSuites: ["GET /orgs/{org}/rulesets/rule-suites"],
    getOrgRuleset: ["GET /orgs/{org}/rulesets/{ruleset_id}"],
    getOrgRulesets: ["GET /orgs/{org}/rulesets"],
    getPages: ["GET /repos/{owner}/{repo}/pages"],
    getPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/{build_id}"],
    getPagesDeployment: [
      "GET /repos/{owner}/{repo}/pages/deployments/{pages_deployment_id}"
    ],
    getPagesHealthCheck: ["GET /repos/{owner}/{repo}/pages/health"],
    getParticipationStats: ["GET /repos/{owner}/{repo}/stats/participation"],
    getPullRequestReviewProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews"
    ],
    getPunchCardStats: ["GET /repos/{owner}/{repo}/stats/punch_card"],
    getReadme: ["GET /repos/{owner}/{repo}/readme"],
    getReadmeInDirectory: ["GET /repos/{owner}/{repo}/readme/{dir}"],
    getRelease: ["GET /repos/{owner}/{repo}/releases/{release_id}"],
    getReleaseAsset: ["GET /repos/{owner}/{repo}/releases/assets/{asset_id}"],
    getReleaseByTag: ["GET /repos/{owner}/{repo}/releases/tags/{tag}"],
    getRepoRuleSuite: [
      "GET /repos/{owner}/{repo}/rulesets/rule-suites/{rule_suite_id}"
    ],
    getRepoRuleSuites: ["GET /repos/{owner}/{repo}/rulesets/rule-suites"],
    getRepoRuleset: ["GET /repos/{owner}/{repo}/rulesets/{ruleset_id}"],
    getRepoRulesetHistory: [
      "GET /repos/{owner}/{repo}/rulesets/{ruleset_id}/history"
    ],
    getRepoRulesetVersion: [
      "GET /repos/{owner}/{repo}/rulesets/{ruleset_id}/history/{version_id}"
    ],
    getRepoRulesets: ["GET /repos/{owner}/{repo}/rulesets"],
    getStatusChecksProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks"
    ],
    getTeamsWithAccessToProtectedBranch: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams"
    ],
    getTopPaths: ["GET /repos/{owner}/{repo}/traffic/popular/paths"],
    getTopReferrers: ["GET /repos/{owner}/{repo}/traffic/popular/referrers"],
    getUsersWithAccessToProtectedBranch: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users"
    ],
    getViews: ["GET /repos/{owner}/{repo}/traffic/views"],
    getWebhook: ["GET /repos/{owner}/{repo}/hooks/{hook_id}"],
    getWebhookConfigForRepo: [
      "GET /repos/{owner}/{repo}/hooks/{hook_id}/config"
    ],
    getWebhookDelivery: [
      "GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}"
    ],
    listActivities: ["GET /repos/{owner}/{repo}/activity"],
    listAttestations: [
      "GET /repos/{owner}/{repo}/attestations/{subject_digest}"
    ],
    listAutolinks: ["GET /repos/{owner}/{repo}/autolinks"],
    listBranches: ["GET /repos/{owner}/{repo}/branches"],
    listBranchesForHeadCommit: [
      "GET /repos/{owner}/{repo}/commits/{commit_sha}/branches-where-head"
    ],
    listCollaborators: ["GET /repos/{owner}/{repo}/collaborators"],
    listCommentsForCommit: [
      "GET /repos/{owner}/{repo}/commits/{commit_sha}/comments"
    ],
    listCommitCommentsForRepo: ["GET /repos/{owner}/{repo}/comments"],
    listCommitStatusesForRef: [
      "GET /repos/{owner}/{repo}/commits/{ref}/statuses"
    ],
    listCommits: ["GET /repos/{owner}/{repo}/commits"],
    listContributors: ["GET /repos/{owner}/{repo}/contributors"],
    listCustomDeploymentRuleIntegrations: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/apps"
    ],
    listDeployKeys: ["GET /repos/{owner}/{repo}/keys"],
    listDeploymentBranchPolicies: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies"
    ],
    listDeploymentStatuses: [
      "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses"
    ],
    listDeployments: ["GET /repos/{owner}/{repo}/deployments"],
    listForAuthenticatedUser: ["GET /user/repos"],
    listForOrg: ["GET /orgs/{org}/repos"],
    listForUser: ["GET /users/{username}/repos"],
    listForks: ["GET /repos/{owner}/{repo}/forks"],
    listInvitations: ["GET /repos/{owner}/{repo}/invitations"],
    listInvitationsForAuthenticatedUser: ["GET /user/repository_invitations"],
    listLanguages: ["GET /repos/{owner}/{repo}/languages"],
    listPagesBuilds: ["GET /repos/{owner}/{repo}/pages/builds"],
    listPublic: ["GET /repositories"],
    listPullRequestsAssociatedWithCommit: [
      "GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls"
    ],
    listReleaseAssets: [
      "GET /repos/{owner}/{repo}/releases/{release_id}/assets"
    ],
    listReleases: ["GET /repos/{owner}/{repo}/releases"],
    listTags: ["GET /repos/{owner}/{repo}/tags"],
    listTeams: ["GET /repos/{owner}/{repo}/teams"],
    listWebhookDeliveries: [
      "GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries"
    ],
    listWebhooks: ["GET /repos/{owner}/{repo}/hooks"],
    merge: ["POST /repos/{owner}/{repo}/merges"],
    mergeUpstream: ["POST /repos/{owner}/{repo}/merge-upstream"],
    pingWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/pings"],
    redeliverWebhookDelivery: [
      "POST /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}/attempts"
    ],
    removeAppAccessRestrictions: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
      {},
      { mapToData: "apps" }
    ],
    removeCollaborator: [
      "DELETE /repos/{owner}/{repo}/collaborators/{username}"
    ],
    removeStatusCheckContexts: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
      {},
      { mapToData: "contexts" }
    ],
    removeStatusCheckProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks"
    ],
    removeTeamAccessRestrictions: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
      {},
      { mapToData: "teams" }
    ],
    removeUserAccessRestrictions: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
      {},
      { mapToData: "users" }
    ],
    renameBranch: ["POST /repos/{owner}/{repo}/branches/{branch}/rename"],
    replaceAllTopics: ["PUT /repos/{owner}/{repo}/topics"],
    requestPagesBuild: ["POST /repos/{owner}/{repo}/pages/builds"],
    setAdminBranchProtection: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins"
    ],
    setAppAccessRestrictions: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
      {},
      { mapToData: "apps" }
    ],
    setStatusCheckContexts: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
      {},
      { mapToData: "contexts" }
    ],
    setTeamAccessRestrictions: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
      {},
      { mapToData: "teams" }
    ],
    setUserAccessRestrictions: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
      {},
      { mapToData: "users" }
    ],
    testPushWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/tests"],
    transfer: ["POST /repos/{owner}/{repo}/transfer"],
    update: ["PATCH /repos/{owner}/{repo}"],
    updateBranchProtection: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection"
    ],
    updateCommitComment: ["PATCH /repos/{owner}/{repo}/comments/{comment_id}"],
    updateDeploymentBranchPolicy: [
      "PUT /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}"
    ],
    updateInformationAboutPagesSite: ["PUT /repos/{owner}/{repo}/pages"],
    updateInvitation: [
      "PATCH /repos/{owner}/{repo}/invitations/{invitation_id}"
    ],
    updateOrgRuleset: ["PUT /orgs/{org}/rulesets/{ruleset_id}"],
    updatePullRequestReviewProtection: [
      "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews"
    ],
    updateRelease: ["PATCH /repos/{owner}/{repo}/releases/{release_id}"],
    updateReleaseAsset: [
      "PATCH /repos/{owner}/{repo}/releases/assets/{asset_id}"
    ],
    updateRepoRuleset: ["PUT /repos/{owner}/{repo}/rulesets/{ruleset_id}"],
    updateStatusCheckPotection: [
      "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
      {},
      { renamed: ["repos", "updateStatusCheckProtection"] }
    ],
    updateStatusCheckProtection: [
      "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks"
    ],
    updateWebhook: ["PATCH /repos/{owner}/{repo}/hooks/{hook_id}"],
    updateWebhookConfigForRepo: [
      "PATCH /repos/{owner}/{repo}/hooks/{hook_id}/config"
    ],
    uploadReleaseAsset: [
      "POST /repos/{owner}/{repo}/releases/{release_id}/assets{?name,label}",
      { baseUrl: "https://uploads.github.com" }
    ]
  },
  search: {
    code: ["GET /search/code"],
    commits: ["GET /search/commits"],
    issuesAndPullRequests: ["GET /search/issues"],
    labels: ["GET /search/labels"],
    repos: ["GET /search/repositories"],
    topics: ["GET /search/topics"],
    users: ["GET /search/users"]
  },
  secretScanning: {
    createPushProtectionBypass: [
      "POST /repos/{owner}/{repo}/secret-scanning/push-protection-bypasses"
    ],
    getAlert: [
      "GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}"
    ],
    getScanHistory: ["GET /repos/{owner}/{repo}/secret-scanning/scan-history"],
    listAlertsForOrg: ["GET /orgs/{org}/secret-scanning/alerts"],
    listAlertsForRepo: ["GET /repos/{owner}/{repo}/secret-scanning/alerts"],
    listLocationsForAlert: [
      "GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}/locations"
    ],
    listOrgPatternConfigs: [
      "GET /orgs/{org}/secret-scanning/pattern-configurations"
    ],
    updateAlert: [
      "PATCH /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}"
    ],
    updateOrgPatternConfigs: [
      "PATCH /orgs/{org}/secret-scanning/pattern-configurations"
    ]
  },
  securityAdvisories: {
    createFork: [
      "POST /repos/{owner}/{repo}/security-advisories/{ghsa_id}/forks"
    ],
    createPrivateVulnerabilityReport: [
      "POST /repos/{owner}/{repo}/security-advisories/reports"
    ],
    createRepositoryAdvisory: [
      "POST /repos/{owner}/{repo}/security-advisories"
    ],
    createRepositoryAdvisoryCveRequest: [
      "POST /repos/{owner}/{repo}/security-advisories/{ghsa_id}/cve"
    ],
    getGlobalAdvisory: ["GET /advisories/{ghsa_id}"],
    getRepositoryAdvisory: [
      "GET /repos/{owner}/{repo}/security-advisories/{ghsa_id}"
    ],
    listGlobalAdvisories: ["GET /advisories"],
    listOrgRepositoryAdvisories: ["GET /orgs/{org}/security-advisories"],
    listRepositoryAdvisories: ["GET /repos/{owner}/{repo}/security-advisories"],
    updateRepositoryAdvisory: [
      "PATCH /repos/{owner}/{repo}/security-advisories/{ghsa_id}"
    ]
  },
  teams: {
    addOrUpdateMembershipForUserInOrg: [
      "PUT /orgs/{org}/teams/{team_slug}/memberships/{username}"
    ],
    addOrUpdateRepoPermissionsInOrg: [
      "PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}"
    ],
    checkPermissionsForRepoInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}"
    ],
    create: ["POST /orgs/{org}/teams"],
    createDiscussionCommentInOrg: [
      "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments"
    ],
    createDiscussionInOrg: ["POST /orgs/{org}/teams/{team_slug}/discussions"],
    deleteDiscussionCommentInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}"
    ],
    deleteDiscussionInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}"
    ],
    deleteInOrg: ["DELETE /orgs/{org}/teams/{team_slug}"],
    getByName: ["GET /orgs/{org}/teams/{team_slug}"],
    getDiscussionCommentInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}"
    ],
    getDiscussionInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}"
    ],
    getMembershipForUserInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/memberships/{username}"
    ],
    list: ["GET /orgs/{org}/teams"],
    listChildInOrg: ["GET /orgs/{org}/teams/{team_slug}/teams"],
    listDiscussionCommentsInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments"
    ],
    listDiscussionsInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions"],
    listForAuthenticatedUser: ["GET /user/teams"],
    listMembersInOrg: ["GET /orgs/{org}/teams/{team_slug}/members"],
    listPendingInvitationsInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/invitations"
    ],
    listReposInOrg: ["GET /orgs/{org}/teams/{team_slug}/repos"],
    removeMembershipForUserInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/memberships/{username}"
    ],
    removeRepoInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}"
    ],
    updateDiscussionCommentInOrg: [
      "PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}"
    ],
    updateDiscussionInOrg: [
      "PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}"
    ],
    updateInOrg: ["PATCH /orgs/{org}/teams/{team_slug}"]
  },
  users: {
    addEmailForAuthenticated: [
      "POST /user/emails",
      {},
      { renamed: ["users", "addEmailForAuthenticatedUser"] }
    ],
    addEmailForAuthenticatedUser: ["POST /user/emails"],
    addSocialAccountForAuthenticatedUser: ["POST /user/social_accounts"],
    block: ["PUT /user/blocks/{username}"],
    checkBlocked: ["GET /user/blocks/{username}"],
    checkFollowingForUser: ["GET /users/{username}/following/{target_user}"],
    checkPersonIsFollowedByAuthenticated: ["GET /user/following/{username}"],
    createGpgKeyForAuthenticated: [
      "POST /user/gpg_keys",
      {},
      { renamed: ["users", "createGpgKeyForAuthenticatedUser"] }
    ],
    createGpgKeyForAuthenticatedUser: ["POST /user/gpg_keys"],
    createPublicSshKeyForAuthenticated: [
      "POST /user/keys",
      {},
      { renamed: ["users", "createPublicSshKeyForAuthenticatedUser"] }
    ],
    createPublicSshKeyForAuthenticatedUser: ["POST /user/keys"],
    createSshSigningKeyForAuthenticatedUser: ["POST /user/ssh_signing_keys"],
    deleteAttestationsBulk: [
      "POST /users/{username}/attestations/delete-request"
    ],
    deleteAttestationsById: [
      "DELETE /users/{username}/attestations/{attestation_id}"
    ],
    deleteAttestationsBySubjectDigest: [
      "DELETE /users/{username}/attestations/digest/{subject_digest}"
    ],
    deleteEmailForAuthenticated: [
      "DELETE /user/emails",
      {},
      { renamed: ["users", "deleteEmailForAuthenticatedUser"] }
    ],
    deleteEmailForAuthenticatedUser: ["DELETE /user/emails"],
    deleteGpgKeyForAuthenticated: [
      "DELETE /user/gpg_keys/{gpg_key_id}",
      {},
      { renamed: ["users", "deleteGpgKeyForAuthenticatedUser"] }
    ],
    deleteGpgKeyForAuthenticatedUser: ["DELETE /user/gpg_keys/{gpg_key_id}"],
    deletePublicSshKeyForAuthenticated: [
      "DELETE /user/keys/{key_id}",
      {},
      { renamed: ["users", "deletePublicSshKeyForAuthenticatedUser"] }
    ],
    deletePublicSshKeyForAuthenticatedUser: ["DELETE /user/keys/{key_id}"],
    deleteSocialAccountForAuthenticatedUser: ["DELETE /user/social_accounts"],
    deleteSshSigningKeyForAuthenticatedUser: [
      "DELETE /user/ssh_signing_keys/{ssh_signing_key_id}"
    ],
    follow: ["PUT /user/following/{username}"],
    getAuthenticated: ["GET /user"],
    getById: ["GET /user/{account_id}"],
    getByUsername: ["GET /users/{username}"],
    getContextForUser: ["GET /users/{username}/hovercard"],
    getGpgKeyForAuthenticated: [
      "GET /user/gpg_keys/{gpg_key_id}",
      {},
      { renamed: ["users", "getGpgKeyForAuthenticatedUser"] }
    ],
    getGpgKeyForAuthenticatedUser: ["GET /user/gpg_keys/{gpg_key_id}"],
    getPublicSshKeyForAuthenticated: [
      "GET /user/keys/{key_id}",
      {},
      { renamed: ["users", "getPublicSshKeyForAuthenticatedUser"] }
    ],
    getPublicSshKeyForAuthenticatedUser: ["GET /user/keys/{key_id}"],
    getSshSigningKeyForAuthenticatedUser: [
      "GET /user/ssh_signing_keys/{ssh_signing_key_id}"
    ],
    list: ["GET /users"],
    listAttestations: ["GET /users/{username}/attestations/{subject_digest}"],
    listAttestationsBulk: [
      "POST /users/{username}/attestations/bulk-list{?per_page,before,after}"
    ],
    listBlockedByAuthenticated: [
      "GET /user/blocks",
      {},
      { renamed: ["users", "listBlockedByAuthenticatedUser"] }
    ],
    listBlockedByAuthenticatedUser: ["GET /user/blocks"],
    listEmailsForAuthenticated: [
      "GET /user/emails",
      {},
      { renamed: ["users", "listEmailsForAuthenticatedUser"] }
    ],
    listEmailsForAuthenticatedUser: ["GET /user/emails"],
    listFollowedByAuthenticated: [
      "GET /user/following",
      {},
      { renamed: ["users", "listFollowedByAuthenticatedUser"] }
    ],
    listFollowedByAuthenticatedUser: ["GET /user/following"],
    listFollowersForAuthenticatedUser: ["GET /user/followers"],
    listFollowersForUser: ["GET /users/{username}/followers"],
    listFollowingForUser: ["GET /users/{username}/following"],
    listGpgKeysForAuthenticated: [
      "GET /user/gpg_keys",
      {},
      { renamed: ["users", "listGpgKeysForAuthenticatedUser"] }
    ],
    listGpgKeysForAuthenticatedUser: ["GET /user/gpg_keys"],
    listGpgKeysForUser: ["GET /users/{username}/gpg_keys"],
    listPublicEmailsForAuthenticated: [
      "GET /user/public_emails",
      {},
      { renamed: ["users", "listPublicEmailsForAuthenticatedUser"] }
    ],
    listPublicEmailsForAuthenticatedUser: ["GET /user/public_emails"],
    listPublicKeysForUser: ["GET /users/{username}/keys"],
    listPublicSshKeysForAuthenticated: [
      "GET /user/keys",
      {},
      { renamed: ["users", "listPublicSshKeysForAuthenticatedUser"] }
    ],
    listPublicSshKeysForAuthenticatedUser: ["GET /user/keys"],
    listSocialAccountsForAuthenticatedUser: ["GET /user/social_accounts"],
    listSocialAccountsForUser: ["GET /users/{username}/social_accounts"],
    listSshSigningKeysForAuthenticatedUser: ["GET /user/ssh_signing_keys"],
    listSshSigningKeysForUser: ["GET /users/{username}/ssh_signing_keys"],
    setPrimaryEmailVisibilityForAuthenticated: [
      "PATCH /user/email/visibility",
      {},
      { renamed: ["users", "setPrimaryEmailVisibilityForAuthenticatedUser"] }
    ],
    setPrimaryEmailVisibilityForAuthenticatedUser: [
      "PATCH /user/email/visibility"
    ],
    unblock: ["DELETE /user/blocks/{username}"],
    unfollow: ["DELETE /user/following/{username}"],
    updateAuthenticated: ["PATCH /user"]
  }
};
var endpoints_default = Endpoints;

// node_modules/.pnpm/@octokit+plugin-rest-endpoint-methods@17.0.0_@octokit+core@7.0.6/node_modules/@octokit/plugin-rest-endpoint-methods/dist-src/endpoints-to-methods.js
var endpointMethodsMap = /* @__PURE__ */ new Map();
for (const [scope, endpoints] of Object.entries(endpoints_default)) {
  for (const [methodName, endpoint2] of Object.entries(endpoints)) {
    const [route, defaults, decorations] = endpoint2;
    const [method, url2] = route.split(/ /);
    const endpointDefaults = Object.assign(
      {
        method,
        url: url2
      },
      defaults
    );
    if (!endpointMethodsMap.has(scope)) {
      endpointMethodsMap.set(scope, /* @__PURE__ */ new Map());
    }
    endpointMethodsMap.get(scope).set(methodName, {
      scope,
      methodName,
      endpointDefaults,
      decorations
    });
  }
}
var handler = {
  has({ scope }, methodName) {
    return endpointMethodsMap.get(scope).has(methodName);
  },
  getOwnPropertyDescriptor(target, methodName) {
    return {
      value: this.get(target, methodName),
      // ensures method is in the cache
      configurable: true,
      writable: true,
      enumerable: true
    };
  },
  defineProperty(target, methodName, descriptor) {
    Object.defineProperty(target.cache, methodName, descriptor);
    return true;
  },
  deleteProperty(target, methodName) {
    delete target.cache[methodName];
    return true;
  },
  ownKeys({ scope }) {
    return [...endpointMethodsMap.get(scope).keys()];
  },
  set(target, methodName, value) {
    return target.cache[methodName] = value;
  },
  get({ octokit, scope, cache }, methodName) {
    if (cache[methodName]) {
      return cache[methodName];
    }
    const method = endpointMethodsMap.get(scope).get(methodName);
    if (!method) {
      return void 0;
    }
    const { endpointDefaults, decorations } = method;
    if (decorations) {
      cache[methodName] = decorate(
        octokit,
        scope,
        methodName,
        endpointDefaults,
        decorations
      );
    } else {
      cache[methodName] = octokit.request.defaults(endpointDefaults);
    }
    return cache[methodName];
  }
};
function endpointsToMethods(octokit) {
  const newMethods = {};
  for (const scope of endpointMethodsMap.keys()) {
    newMethods[scope] = new Proxy({ octokit, scope, cache: {} }, handler);
  }
  return newMethods;
}
function decorate(octokit, scope, methodName, defaults, decorations) {
  const requestWithDefaults = octokit.request.defaults(defaults);
  function withDecorations(...args) {
    let options = requestWithDefaults.endpoint.merge(...args);
    if (decorations.mapToData) {
      options = Object.assign({}, options, {
        data: options[decorations.mapToData],
        [decorations.mapToData]: void 0
      });
      return requestWithDefaults(options);
    }
    if (decorations.renamed) {
      const [newScope, newMethodName] = decorations.renamed;
      octokit.log.warn(
        `octokit.${scope}.${methodName}() has been renamed to octokit.${newScope}.${newMethodName}()`
      );
    }
    if (decorations.deprecated) {
      octokit.log.warn(decorations.deprecated);
    }
    if (decorations.renamedParameters) {
      const options2 = requestWithDefaults.endpoint.merge(...args);
      for (const [name2, alias] of Object.entries(
        decorations.renamedParameters
      )) {
        if (name2 in options2) {
          octokit.log.warn(
            `"${name2}" parameter is deprecated for "octokit.${scope}.${methodName}()". Use "${alias}" instead`
          );
          if (!(alias in options2)) {
            options2[alias] = options2[name2];
          }
          delete options2[name2];
        }
      }
      return requestWithDefaults(options2);
    }
    return requestWithDefaults(...args);
  }
  return Object.assign(withDecorations, requestWithDefaults);
}

// node_modules/.pnpm/@octokit+plugin-rest-endpoint-methods@17.0.0_@octokit+core@7.0.6/node_modules/@octokit/plugin-rest-endpoint-methods/dist-src/index.js
function restEndpointMethods(octokit) {
  const api = endpointsToMethods(octokit);
  return {
    rest: api
  };
}
restEndpointMethods.VERSION = VERSION6;
function legacyRestEndpointMethods(octokit) {
  const api = endpointsToMethods(octokit);
  return {
    ...api,
    rest: api
  };
}
legacyRestEndpointMethods.VERSION = VERSION6;

// node_modules/.pnpm/@octokit+plugin-retry@8.1.0_@octokit+core@7.0.6/node_modules/@octokit/plugin-retry/dist-bundle/index.js
var import_light = __toESM(require_light(), 1);
var VERSION7 = "0.0.0-development";
function isRequestError(error) {
  return error.request !== void 0;
}
async function errorRequest(state, octokit, error, options) {
  if (!isRequestError(error) || !error?.request.request) {
    throw error;
  }
  if (error.status >= 400 && !state.doNotRetry.includes(error.status)) {
    const retries = options.request.retries != null ? options.request.retries : state.retries;
    const retryAfter = Math.pow((options.request.retryCount || 0) + 1, 2);
    throw octokit.retry.retryRequest(error, retries, retryAfter);
  }
  throw error;
}
async function wrapRequest(state, octokit, request2, options) {
  const limiter = new import_light.default();
  limiter.on("failed", function(error, info) {
    const maxRetries = ~~error.request.request?.retries;
    const after = ~~error.request.request?.retryAfter;
    options.request.retryCount = info.retryCount + 1;
    if (maxRetries > info.retryCount) {
      return after * state.retryAfterBaseValue;
    }
  });
  return limiter.schedule(
    requestWithGraphqlErrorHandling.bind(null, state, octokit, request2),
    options
  );
}
async function requestWithGraphqlErrorHandling(state, octokit, request2, options) {
  const response = await request2(options);
  if (response.data && response.data.errors && response.data.errors.length > 0 && /Something went wrong while executing your query/.test(
    response.data.errors[0].message
  )) {
    const error = new RequestError(response.data.errors[0].message, 500, {
      request: options,
      response
    });
    return errorRequest(state, octokit, error, options);
  }
  return response;
}
function retry(octokit, octokitOptions) {
  const state = Object.assign(
    {
      enabled: true,
      retryAfterBaseValue: 1e3,
      doNotRetry: [400, 401, 403, 404, 410, 422, 451],
      retries: 3
    },
    octokitOptions.retry
  );
  const retryPlugin = {
    retry: {
      retryRequest: (error, retries, retryAfter) => {
        error.request.request = Object.assign({}, error.request.request, {
          retries,
          retryAfter
        });
        return error;
      }
    }
  };
  if (state.enabled) {
    octokit.hook.error("request", errorRequest.bind(null, state, retryPlugin));
    octokit.hook.wrap("request", wrapRequest.bind(null, state, retryPlugin));
  }
  return retryPlugin;
}
retry.VERSION = VERSION7;

// node_modules/.pnpm/@octokit+plugin-throttling@11.0.3_@octokit+core@7.0.6/node_modules/@octokit/plugin-throttling/dist-bundle/index.js
var import_light2 = __toESM(require_light(), 1);
var VERSION8 = "0.0.0-development";
var noop3 = () => Promise.resolve();
function wrapRequest2(state, request2, options) {
  return state.retryLimiter.schedule(doRequest, state, request2, options);
}
async function doRequest(state, request2, options) {
  const { pathname } = new URL(options.url, "http://github.test");
  const isAuth = isAuthRequest(options.method, pathname);
  const isWrite = !isAuth && options.method !== "GET" && options.method !== "HEAD";
  const isSearch = options.method === "GET" && pathname.startsWith("/search/");
  const isGraphQL = pathname.startsWith("/graphql");
  const retryCount = ~~request2.retryCount;
  const jobOptions = retryCount > 0 ? { priority: 0, weight: 0 } : {};
  if (state.clustering) {
    jobOptions.expiration = 1e3 * 60;
  }
  if (isWrite || isGraphQL) {
    await state.write.key(state.id).schedule(jobOptions, noop3);
  }
  if (isWrite && state.triggersNotification(pathname)) {
    await state.notifications.key(state.id).schedule(jobOptions, noop3);
  }
  if (isSearch) {
    await state.search.key(state.id).schedule(jobOptions, noop3);
  }
  const req = (isAuth ? state.auth : state.global).key(state.id).schedule(jobOptions, request2, options);
  if (isGraphQL) {
    const res = await req;
    if (res.data.errors != null && res.data.errors.some((error) => error.type === "RATE_LIMITED")) {
      const error = Object.assign(new Error("GraphQL Rate Limit Exceeded"), {
        response: res,
        data: res.data
      });
      throw error;
    }
  }
  return req;
}
function isAuthRequest(method, pathname) {
  return method === "PATCH" && // https://docs.github.com/en/rest/apps/apps?apiVersion=2022-11-28#create-a-scoped-access-token
  /^\/applications\/[^/]+\/token\/scoped$/.test(pathname) || method === "POST" && // https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2022-11-28#reset-a-token
  (/^\/applications\/[^/]+\/token$/.test(pathname) || // https://docs.github.com/en/rest/apps/apps?apiVersion=2022-11-28#create-an-installation-access-token-for-an-app
  /^\/app\/installations\/[^/]+\/access_tokens$/.test(pathname) || // https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
  pathname === "/login/oauth/access_token");
}
var triggers_notification_paths_default = [
  "/orgs/{org}/invitations",
  "/orgs/{org}/invitations/{invitation_id}",
  "/orgs/{org}/teams/{team_slug}/discussions",
  "/orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments",
  "/repos/{owner}/{repo}/collaborators/{username}",
  "/repos/{owner}/{repo}/commits/{commit_sha}/comments",
  "/repos/{owner}/{repo}/issues",
  "/repos/{owner}/{repo}/issues/{issue_number}/comments",
  "/repos/{owner}/{repo}/issues/{issue_number}/sub_issue",
  "/repos/{owner}/{repo}/issues/{issue_number}/sub_issues/priority",
  "/repos/{owner}/{repo}/pulls",
  "/repos/{owner}/{repo}/pulls/{pull_number}/comments",
  "/repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies",
  "/repos/{owner}/{repo}/pulls/{pull_number}/merge",
  "/repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
  "/repos/{owner}/{repo}/pulls/{pull_number}/reviews",
  "/repos/{owner}/{repo}/releases",
  "/teams/{team_id}/discussions",
  "/teams/{team_id}/discussions/{discussion_number}/comments"
];
function routeMatcher(paths) {
  const regexes = paths.map(
    (path) => path.split("/").map((c) => c.startsWith("{") ? "(?:.+?)" : c).join("/")
  );
  const regex22 = `^(?:${regexes.map((r) => `(?:${r})`).join("|")})[^/]*$`;
  return new RegExp(regex22, "i");
}
var regex2 = routeMatcher(triggers_notification_paths_default);
var triggersNotification = regex2.test.bind(regex2);
var groups = {};
var createGroups = function(Bottleneck2, common) {
  groups.global = new Bottleneck2.Group({
    id: "octokit-global",
    maxConcurrent: 10,
    ...common
  });
  groups.auth = new Bottleneck2.Group({
    id: "octokit-auth",
    maxConcurrent: 1,
    ...common
  });
  groups.search = new Bottleneck2.Group({
    id: "octokit-search",
    maxConcurrent: 1,
    minTime: 2e3,
    ...common
  });
  groups.write = new Bottleneck2.Group({
    id: "octokit-write",
    maxConcurrent: 1,
    minTime: 1e3,
    ...common
  });
  groups.notifications = new Bottleneck2.Group({
    id: "octokit-notifications",
    maxConcurrent: 1,
    minTime: 3e3,
    ...common
  });
};
function throttling(octokit, octokitOptions) {
  const {
    enabled = true,
    Bottleneck: Bottleneck2 = import_light2.default,
    id = "no-id",
    timeout = 1e3 * 60 * 2,
    // Redis TTL: 2 minutes
    connection
  } = octokitOptions.throttle || {};
  if (!enabled) {
    return {};
  }
  const common = { timeout };
  if (typeof connection !== "undefined") {
    common.connection = connection;
  }
  if (groups.global == null) {
    createGroups(Bottleneck2, common);
  }
  const state = Object.assign(
    {
      clustering: connection != null,
      triggersNotification,
      fallbackSecondaryRateRetryAfter: 60,
      retryAfterBaseValue: 1e3,
      retryLimiter: new Bottleneck2(),
      id,
      ...groups
    },
    octokitOptions.throttle
  );
  if (typeof state.onSecondaryRateLimit !== "function" || typeof state.onRateLimit !== "function") {
    throw new Error(`octokit/plugin-throttling error:
        You must pass the onSecondaryRateLimit and onRateLimit error handlers.
        See https://octokit.github.io/rest.js/#throttling

        const octokit = new Octokit({
          throttle: {
            onSecondaryRateLimit: (retryAfter, options) => {/* ... */},
            onRateLimit: (retryAfter, options) => {/* ... */}
          }
        })
    `);
  }
  const events = {};
  const emitter = new Bottleneck2.Events(events);
  events.on("secondary-limit", state.onSecondaryRateLimit);
  events.on("rate-limit", state.onRateLimit);
  events.on(
    "error",
    (e) => octokit.log.warn("Error in throttling-plugin limit handler", e)
  );
  state.retryLimiter.on("failed", async function(error, info) {
    const [state2, request2, options] = info.args;
    const { pathname } = new URL(options.url, "http://github.test");
    const shouldRetryGraphQL = pathname.startsWith("/graphql") && error.status !== 401;
    if (!(shouldRetryGraphQL || error.status === 403 || error.status === 429)) {
      return;
    }
    const retryCount = ~~request2.retryCount;
    request2.retryCount = retryCount;
    options.request.retryCount = retryCount;
    const { wantRetry, retryAfter = 0 } = await (async function() {
      if (/\bsecondary rate\b/i.test(error.message)) {
        const retryAfter2 = Number(error.response.headers["retry-after"]) || state2.fallbackSecondaryRateRetryAfter;
        const wantRetry2 = await emitter.trigger(
          "secondary-limit",
          retryAfter2,
          options,
          octokit,
          retryCount
        );
        return { wantRetry: wantRetry2, retryAfter: retryAfter2 };
      }
      if (error.response.headers != null && error.response.headers["x-ratelimit-remaining"] === "0" || (error.response.data?.errors ?? []).some(
        (error2) => error2.type === "RATE_LIMITED"
      )) {
        const rateLimitReset = new Date(
          ~~error.response.headers["x-ratelimit-reset"] * 1e3
        ).getTime();
        const retryAfter2 = Math.max(
          // Add one second so we retry _after_ the reset time
          // https://docs.github.com/en/rest/overview/resources-in-the-rest-api?apiVersion=2022-11-28#exceeding-the-rate-limit
          Math.ceil((rateLimitReset - Date.now()) / 1e3) + 1,
          0
        );
        const wantRetry2 = await emitter.trigger(
          "rate-limit",
          retryAfter2,
          options,
          octokit,
          retryCount
        );
        return { wantRetry: wantRetry2, retryAfter: retryAfter2 };
      }
      return {};
    })();
    if (wantRetry) {
      request2.retryCount++;
      return retryAfter * state2.retryAfterBaseValue;
    }
  });
  octokit.hook.wrap("request", wrapRequest2.bind(null, state));
  return {};
}
throttling.VERSION = VERSION8;
throttling.triggersNotification = triggersNotification;

// node_modules/.pnpm/@octokit+oauth-authorization-url@8.0.0/node_modules/@octokit/oauth-authorization-url/dist-src/index.js
function oauthAuthorizationUrl(options) {
  const clientType = options.clientType || "oauth-app";
  const baseUrl = options.baseUrl || "https://github.com";
  const result = {
    clientType,
    allowSignup: options.allowSignup === false ? false : true,
    clientId: options.clientId,
    login: options.login || null,
    redirectUrl: options.redirectUrl || null,
    state: options.state || Math.random().toString(36).substr(2),
    url: ""
  };
  if (clientType === "oauth-app") {
    const scopes = "scopes" in options ? options.scopes : [];
    result.scopes = typeof scopes === "string" ? scopes.split(/[,\s]+/).filter(Boolean) : scopes;
  }
  result.url = urlBuilderAuthorize(`${baseUrl}/login/oauth/authorize`, result);
  return result;
}
function urlBuilderAuthorize(base, options) {
  const map = {
    allowSignup: "allow_signup",
    clientId: "client_id",
    login: "login",
    redirectUrl: "redirect_uri",
    scopes: "scope",
    state: "state"
  };
  let url2 = base;
  Object.keys(map).filter((k) => options[k] !== null).filter((k) => {
    if (k !== "scopes") return true;
    if (options.clientType === "github-app") return false;
    return !Array.isArray(options[k]) || options[k].length > 0;
  }).map((key) => [map[key], `${options[key]}`]).forEach(([key, value], index) => {
    url2 += index === 0 ? `?` : "&";
    url2 += `${key}=${encodeURIComponent(value)}`;
  });
  return url2;
}

// node_modules/.pnpm/@octokit+oauth-methods@6.0.2/node_modules/@octokit/oauth-methods/dist-bundle/index.js
function requestToOAuthBaseUrl(request2) {
  const endpointDefaults = request2.endpoint.DEFAULTS;
  return /^https:\/\/(api\.)?github\.com$/.test(endpointDefaults.baseUrl) ? "https://github.com" : endpointDefaults.baseUrl.replace("/api/v3", "");
}
async function oauthRequest(request2, route, parameters) {
  const withOAuthParameters = {
    baseUrl: requestToOAuthBaseUrl(request2),
    headers: {
      accept: "application/json"
    },
    ...parameters
  };
  const response = await request2(route, withOAuthParameters);
  if ("error" in response.data) {
    const error = new RequestError(
      `${response.data.error_description} (${response.data.error}, ${response.data.error_uri})`,
      400,
      {
        request: request2.endpoint.merge(
          route,
          withOAuthParameters
        )
      }
    );
    error.response = response;
    throw error;
  }
  return response;
}
function getWebFlowAuthorizationUrl({
  request: request2 = request,
  ...options
}) {
  const baseUrl = requestToOAuthBaseUrl(request2);
  return oauthAuthorizationUrl({
    ...options,
    baseUrl
  });
}
async function exchangeWebFlowCode(options) {
  const request2 = options.request || request;
  const response = await oauthRequest(
    request2,
    "POST /login/oauth/access_token",
    {
      client_id: options.clientId,
      client_secret: options.clientSecret,
      code: options.code,
      redirect_uri: options.redirectUrl
    }
  );
  const authentication = {
    clientType: options.clientType,
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    token: response.data.access_token,
    scopes: response.data.scope.split(/\s+/).filter(Boolean)
  };
  if (options.clientType === "github-app") {
    if ("refresh_token" in response.data) {
      const apiTimeInMs = new Date(response.headers.date).getTime();
      authentication.refreshToken = response.data.refresh_token, authentication.expiresAt = toTimestamp(
        apiTimeInMs,
        response.data.expires_in
      ), authentication.refreshTokenExpiresAt = toTimestamp(
        apiTimeInMs,
        response.data.refresh_token_expires_in
      );
    }
    delete authentication.scopes;
  }
  return { ...response, authentication };
}
function toTimestamp(apiTimeInMs, expirationInSeconds) {
  return new Date(apiTimeInMs + expirationInSeconds * 1e3).toISOString();
}
async function createDeviceCode(options) {
  const request2 = options.request || request;
  const parameters = {
    client_id: options.clientId
  };
  if ("scopes" in options && Array.isArray(options.scopes)) {
    parameters.scope = options.scopes.join(" ");
  }
  return oauthRequest(request2, "POST /login/device/code", parameters);
}
async function exchangeDeviceCode(options) {
  const request2 = options.request || request;
  const response = await oauthRequest(
    request2,
    "POST /login/oauth/access_token",
    {
      client_id: options.clientId,
      device_code: options.code,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code"
    }
  );
  const authentication = {
    clientType: options.clientType,
    clientId: options.clientId,
    token: response.data.access_token,
    scopes: response.data.scope.split(/\s+/).filter(Boolean)
  };
  if ("clientSecret" in options) {
    authentication.clientSecret = options.clientSecret;
  }
  if (options.clientType === "github-app") {
    if ("refresh_token" in response.data) {
      const apiTimeInMs = new Date(response.headers.date).getTime();
      authentication.refreshToken = response.data.refresh_token, authentication.expiresAt = toTimestamp2(
        apiTimeInMs,
        response.data.expires_in
      ), authentication.refreshTokenExpiresAt = toTimestamp2(
        apiTimeInMs,
        response.data.refresh_token_expires_in
      );
    }
    delete authentication.scopes;
  }
  return { ...response, authentication };
}
function toTimestamp2(apiTimeInMs, expirationInSeconds) {
  return new Date(apiTimeInMs + expirationInSeconds * 1e3).toISOString();
}
async function checkToken(options) {
  const request2 = options.request || request;
  const response = await request2("POST /applications/{client_id}/token", {
    headers: {
      authorization: `basic ${btoa(
        `${options.clientId}:${options.clientSecret}`
      )}`
    },
    client_id: options.clientId,
    access_token: options.token
  });
  const authentication = {
    clientType: options.clientType,
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    token: options.token,
    scopes: response.data.scopes
  };
  if (response.data.expires_at)
    authentication.expiresAt = response.data.expires_at;
  if (options.clientType === "github-app") {
    delete authentication.scopes;
  }
  return { ...response, authentication };
}
async function refreshToken(options) {
  const request2 = options.request || request;
  const response = await oauthRequest(
    request2,
    "POST /login/oauth/access_token",
    {
      client_id: options.clientId,
      client_secret: options.clientSecret,
      grant_type: "refresh_token",
      refresh_token: options.refreshToken
    }
  );
  const apiTimeInMs = new Date(response.headers.date).getTime();
  const authentication = {
    clientType: "github-app",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    token: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresAt: toTimestamp3(apiTimeInMs, response.data.expires_in),
    refreshTokenExpiresAt: toTimestamp3(
      apiTimeInMs,
      response.data.refresh_token_expires_in
    )
  };
  return { ...response, authentication };
}
function toTimestamp3(apiTimeInMs, expirationInSeconds) {
  return new Date(apiTimeInMs + expirationInSeconds * 1e3).toISOString();
}
async function scopeToken(options) {
  const {
    request: optionsRequest,
    clientType,
    clientId,
    clientSecret,
    token,
    ...requestOptions
  } = options;
  const request2 = options.request || request;
  const response = await request2(
    "POST /applications/{client_id}/token/scoped",
    {
      headers: {
        authorization: `basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      client_id: clientId,
      access_token: token,
      ...requestOptions
    }
  );
  const authentication = Object.assign(
    {
      clientType,
      clientId,
      clientSecret,
      token: response.data.token
    },
    response.data.expires_at ? { expiresAt: response.data.expires_at } : {}
  );
  return { ...response, authentication };
}
async function resetToken(options) {
  const request2 = options.request || request;
  const auth7 = btoa(`${options.clientId}:${options.clientSecret}`);
  const response = await request2(
    "PATCH /applications/{client_id}/token",
    {
      headers: {
        authorization: `basic ${auth7}`
      },
      client_id: options.clientId,
      access_token: options.token
    }
  );
  const authentication = {
    clientType: options.clientType,
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    token: response.data.token,
    scopes: response.data.scopes
  };
  if (response.data.expires_at)
    authentication.expiresAt = response.data.expires_at;
  if (options.clientType === "github-app") {
    delete authentication.scopes;
  }
  return { ...response, authentication };
}
async function deleteToken(options) {
  const request2 = options.request || request;
  const auth7 = btoa(`${options.clientId}:${options.clientSecret}`);
  return request2(
    "DELETE /applications/{client_id}/token",
    {
      headers: {
        authorization: `basic ${auth7}`
      },
      client_id: options.clientId,
      access_token: options.token
    }
  );
}
async function deleteAuthorization(options) {
  const request2 = options.request || request;
  const auth7 = btoa(`${options.clientId}:${options.clientSecret}`);
  return request2(
    "DELETE /applications/{client_id}/grant",
    {
      headers: {
        authorization: `basic ${auth7}`
      },
      client_id: options.clientId,
      access_token: options.token
    }
  );
}

// node_modules/.pnpm/@octokit+auth-oauth-device@8.0.3/node_modules/@octokit/auth-oauth-device/dist-bundle/index.js
async function getOAuthAccessToken(state, options) {
  const cachedAuthentication = getCachedAuthentication(state, options.auth);
  if (cachedAuthentication) return cachedAuthentication;
  const { data: verification } = await createDeviceCode({
    clientType: state.clientType,
    clientId: state.clientId,
    request: options.request || state.request,
    // @ts-expect-error the extra code to make TS happy is not worth it
    scopes: options.auth.scopes || state.scopes
  });
  await state.onVerification(verification);
  const authentication = await waitForAccessToken(
    options.request || state.request,
    state.clientId,
    state.clientType,
    verification
  );
  state.authentication = authentication;
  return authentication;
}
function getCachedAuthentication(state, auth22) {
  if (auth22.refresh === true) return false;
  if (!state.authentication) return false;
  if (state.clientType === "github-app") {
    return state.authentication;
  }
  const authentication = state.authentication;
  const newScope = ("scopes" in auth22 && auth22.scopes || state.scopes).join(
    " "
  );
  const currentScope = authentication.scopes.join(" ");
  return newScope === currentScope ? authentication : false;
}
async function wait(seconds) {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1e3));
}
async function waitForAccessToken(request2, clientId, clientType, verification) {
  try {
    const options = {
      clientId,
      request: request2,
      code: verification.device_code
    };
    const { authentication } = clientType === "oauth-app" ? await exchangeDeviceCode({
      ...options,
      clientType: "oauth-app"
    }) : await exchangeDeviceCode({
      ...options,
      clientType: "github-app"
    });
    return {
      type: "token",
      tokenType: "oauth",
      ...authentication
    };
  } catch (error) {
    if (!error.response) throw error;
    const errorType = error.response.data.error;
    if (errorType === "authorization_pending") {
      await wait(verification.interval);
      return waitForAccessToken(request2, clientId, clientType, verification);
    }
    if (errorType === "slow_down") {
      await wait(verification.interval + 7);
      return waitForAccessToken(request2, clientId, clientType, verification);
    }
    throw error;
  }
}
async function auth2(state, authOptions) {
  return getOAuthAccessToken(state, {
    auth: authOptions
  });
}
async function hook2(state, request2, route, parameters) {
  let endpoint2 = request2.endpoint.merge(
    route,
    parameters
  );
  if (/\/login\/(oauth\/access_token|device\/code)$/.test(endpoint2.url)) {
    return request2(endpoint2);
  }
  const { token } = await getOAuthAccessToken(state, {
    request: request2,
    auth: { type: "oauth" }
  });
  endpoint2.headers.authorization = `token ${token}`;
  return request2(endpoint2);
}
var VERSION9 = "0.0.0-development";
function createOAuthDeviceAuth(options) {
  const requestWithDefaults = options.request || request.defaults({
    headers: {
      "user-agent": `octokit-auth-oauth-device.js/${VERSION9} ${getUserAgent()}`
    }
  });
  const { request: request2 = requestWithDefaults, ...otherOptions } = options;
  const state = options.clientType === "github-app" ? {
    ...otherOptions,
    clientType: "github-app",
    request: request2
  } : {
    ...otherOptions,
    clientType: "oauth-app",
    request: request2,
    scopes: options.scopes || []
  };
  if (!options.clientId) {
    throw new Error(
      '[@octokit/auth-oauth-device] "clientId" option must be set (https://github.com/octokit/auth-oauth-device.js#usage)'
    );
  }
  if (!options.onVerification) {
    throw new Error(
      '[@octokit/auth-oauth-device] "onVerification" option must be a function (https://github.com/octokit/auth-oauth-device.js#usage)'
    );
  }
  return Object.assign(auth2.bind(null, state), {
    hook: hook2.bind(null, state)
  });
}

// node_modules/.pnpm/@octokit+auth-oauth-user@6.0.2/node_modules/@octokit/auth-oauth-user/dist-bundle/index.js
var VERSION10 = "0.0.0-development";
async function getAuthentication(state) {
  if ("code" in state.strategyOptions) {
    const { authentication } = await exchangeWebFlowCode({
      clientId: state.clientId,
      clientSecret: state.clientSecret,
      clientType: state.clientType,
      onTokenCreated: state.onTokenCreated,
      ...state.strategyOptions,
      request: state.request
    });
    return {
      type: "token",
      tokenType: "oauth",
      ...authentication
    };
  }
  if ("onVerification" in state.strategyOptions) {
    const deviceAuth = createOAuthDeviceAuth({
      clientType: state.clientType,
      clientId: state.clientId,
      onTokenCreated: state.onTokenCreated,
      ...state.strategyOptions,
      request: state.request
    });
    const authentication = await deviceAuth({
      type: "oauth"
    });
    return {
      clientSecret: state.clientSecret,
      ...authentication
    };
  }
  if ("token" in state.strategyOptions) {
    return {
      type: "token",
      tokenType: "oauth",
      clientId: state.clientId,
      clientSecret: state.clientSecret,
      clientType: state.clientType,
      onTokenCreated: state.onTokenCreated,
      ...state.strategyOptions
    };
  }
  throw new Error("[@octokit/auth-oauth-user] Invalid strategy options");
}
async function auth3(state, options = {}) {
  if (!state.authentication) {
    state.authentication = state.clientType === "oauth-app" ? await getAuthentication(state) : await getAuthentication(state);
  }
  if (state.authentication.invalid) {
    throw new Error("[@octokit/auth-oauth-user] Token is invalid");
  }
  const currentAuthentication = state.authentication;
  if ("expiresAt" in currentAuthentication) {
    if (options.type === "refresh" || new Date(currentAuthentication.expiresAt) < /* @__PURE__ */ new Date()) {
      const { authentication } = await refreshToken({
        clientType: "github-app",
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        refreshToken: currentAuthentication.refreshToken,
        request: state.request
      });
      state.authentication = {
        tokenType: "oauth",
        type: "token",
        ...authentication
      };
    }
  }
  if (options.type === "refresh") {
    if (state.clientType === "oauth-app") {
      throw new Error(
        "[@octokit/auth-oauth-user] OAuth Apps do not support expiring tokens"
      );
    }
    if (!currentAuthentication.hasOwnProperty("expiresAt")) {
      throw new Error("[@octokit/auth-oauth-user] Refresh token missing");
    }
    await state.onTokenCreated?.(state.authentication, {
      type: options.type
    });
  }
  if (options.type === "check" || options.type === "reset") {
    const method = options.type === "check" ? checkToken : resetToken;
    try {
      const { authentication } = await method({
        // @ts-expect-error making TS happy would require unnecessary code so no
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        token: state.authentication.token,
        request: state.request
      });
      state.authentication = {
        tokenType: "oauth",
        type: "token",
        // @ts-expect-error TBD
        ...authentication
      };
      if (options.type === "reset") {
        await state.onTokenCreated?.(state.authentication, {
          type: options.type
        });
      }
      return state.authentication;
    } catch (error) {
      if (error.status === 404) {
        error.message = "[@octokit/auth-oauth-user] Token is invalid";
        state.authentication.invalid = true;
      }
      throw error;
    }
  }
  if (options.type === "delete" || options.type === "deleteAuthorization") {
    const method = options.type === "delete" ? deleteToken : deleteAuthorization;
    try {
      await method({
        // @ts-expect-error making TS happy would require unnecessary code so no
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        token: state.authentication.token,
        request: state.request
      });
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    state.authentication.invalid = true;
    return state.authentication;
  }
  return state.authentication;
}
var ROUTES_REQUIRING_BASIC_AUTH = /\/applications\/[^/]+\/(token|grant)s?/;
function requiresBasicAuth(url2) {
  return url2 && ROUTES_REQUIRING_BASIC_AUTH.test(url2);
}
async function hook3(state, request2, route, parameters = {}) {
  const endpoint2 = request2.endpoint.merge(
    route,
    parameters
  );
  if (/\/login\/(oauth\/access_token|device\/code)$/.test(endpoint2.url)) {
    return request2(endpoint2);
  }
  if (requiresBasicAuth(endpoint2.url)) {
    const credentials = btoa(`${state.clientId}:${state.clientSecret}`);
    endpoint2.headers.authorization = `basic ${credentials}`;
    return request2(endpoint2);
  }
  const { token } = state.clientType === "oauth-app" ? await auth3({ ...state, request: request2 }) : await auth3({ ...state, request: request2 });
  endpoint2.headers.authorization = "token " + token;
  return request2(endpoint2);
}
function createOAuthUserAuth({
  clientId,
  clientSecret,
  clientType = "oauth-app",
  request: request2 = request.defaults({
    headers: {
      "user-agent": `octokit-auth-oauth-app.js/${VERSION10} ${getUserAgent()}`
    }
  }),
  onTokenCreated,
  ...strategyOptions
}) {
  const state = Object.assign({
    clientType,
    clientId,
    clientSecret,
    onTokenCreated,
    strategyOptions,
    request: request2
  });
  return Object.assign(auth3.bind(null, state), {
    // @ts-expect-error not worth the extra code needed to appease TS
    hook: hook3.bind(null, state)
  });
}
createOAuthUserAuth.VERSION = VERSION10;

// node_modules/.pnpm/@octokit+auth-oauth-app@9.0.3/node_modules/@octokit/auth-oauth-app/dist-bundle/index.js
async function auth4(state, authOptions) {
  if (authOptions.type === "oauth-app") {
    return {
      type: "oauth-app",
      clientId: state.clientId,
      clientSecret: state.clientSecret,
      clientType: state.clientType,
      headers: {
        authorization: `basic ${btoa(
          `${state.clientId}:${state.clientSecret}`
        )}`
      }
    };
  }
  if ("factory" in authOptions) {
    const { type, ...options } = {
      ...authOptions,
      ...state
    };
    return authOptions.factory(options);
  }
  const common = {
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.request,
    ...authOptions
  };
  const userAuth = state.clientType === "oauth-app" ? await createOAuthUserAuth({
    ...common,
    clientType: state.clientType
  }) : await createOAuthUserAuth({
    ...common,
    clientType: state.clientType
  });
  return userAuth();
}
async function hook4(state, request2, route, parameters) {
  let endpoint2 = request2.endpoint.merge(
    route,
    parameters
  );
  if (/\/login\/(oauth\/access_token|device\/code)$/.test(endpoint2.url)) {
    return request2(endpoint2);
  }
  if (state.clientType === "github-app" && !requiresBasicAuth(endpoint2.url)) {
    throw new Error(
      `[@octokit/auth-oauth-app] GitHub Apps cannot use their client ID/secret for basic authentication for endpoints other than "/applications/{client_id}/**". "${endpoint2.method} ${endpoint2.url}" is not supported.`
    );
  }
  const credentials = btoa(`${state.clientId}:${state.clientSecret}`);
  endpoint2.headers.authorization = `basic ${credentials}`;
  try {
    return await request2(endpoint2);
  } catch (error) {
    if (error.status !== 401) throw error;
    error.message = `[@octokit/auth-oauth-app] "${endpoint2.method} ${endpoint2.url}" does not support clientId/clientSecret basic authentication.`;
    throw error;
  }
}
var VERSION11 = "0.0.0-development";
function createOAuthAppAuth(options) {
  const state = Object.assign(
    {
      request: request.defaults({
        headers: {
          "user-agent": `octokit-auth-oauth-app.js/${VERSION11} ${getUserAgent()}`
        }
      }),
      clientType: "oauth-app"
    },
    options
  );
  return Object.assign(auth4.bind(null, state), {
    hook: hook4.bind(null, state)
  });
}

// node_modules/.pnpm/universal-github-app-jwt@2.2.2/node_modules/universal-github-app-jwt/lib/utils.js
function isPkcs1(privateKey) {
  return privateKey.includes("-----BEGIN RSA PRIVATE KEY-----");
}
function isOpenSsh(privateKey) {
  return privateKey.includes("-----BEGIN OPENSSH PRIVATE KEY-----");
}
function string2ArrayBuffer(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
function getDERfromPEM(pem) {
  const pemB64 = pem.trim().split("\n").slice(1, -1).join("");
  const decoded = atob(pemB64);
  return string2ArrayBuffer(decoded);
}
function getEncodedMessage(header, payload) {
  return `${base64encodeJSON(header)}.${base64encodeJSON(payload)}`;
}
function base64encode(buffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return fromBase64(btoa(binary));
}
function fromBase64(base642) {
  return base642.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function base64encodeJSON(obj) {
  return fromBase64(btoa(JSON.stringify(obj)));
}

// node_modules/.pnpm/universal-github-app-jwt@2.2.2/node_modules/universal-github-app-jwt/lib/crypto-node.js
import { subtle } from "node:crypto";
import { createPrivateKey } from "node:crypto";
function convertPrivateKey(privateKey) {
  if (!isPkcs1(privateKey)) return privateKey;
  return createPrivateKey(privateKey).export({
    type: "pkcs8",
    format: "pem"
  });
}

// node_modules/.pnpm/universal-github-app-jwt@2.2.2/node_modules/universal-github-app-jwt/lib/get-token.js
async function getToken({ privateKey, payload }) {
  const convertedPrivateKey = convertPrivateKey(privateKey);
  if (isPkcs1(convertedPrivateKey)) {
    throw new Error(
      "[universal-github-app-jwt] Private Key is in PKCS#1 format, but only PKCS#8 is supported. See https://github.com/gr2m/universal-github-app-jwt#private-key-formats"
    );
  }
  if (isOpenSsh(convertedPrivateKey)) {
    throw new Error(
      "[universal-github-app-jwt] Private Key is in OpenSSH format, but only PKCS#8 is supported. See https://github.com/gr2m/universal-github-app-jwt#private-key-formats"
    );
  }
  const algorithm = {
    name: "RSASSA-PKCS1-v1_5",
    hash: { name: "SHA-256" }
  };
  const header = { alg: "RS256", typ: "JWT" };
  const privateKeyDER = getDERfromPEM(convertedPrivateKey);
  const importedKey = await subtle.importKey(
    "pkcs8",
    privateKeyDER,
    algorithm,
    false,
    ["sign"]
  );
  const encodedMessage = getEncodedMessage(header, payload);
  const encodedMessageArrBuf = string2ArrayBuffer(encodedMessage);
  const signatureArrBuf = await subtle.sign(
    algorithm.name,
    importedKey,
    encodedMessageArrBuf
  );
  const encodedSignature = base64encode(signatureArrBuf);
  return `${encodedMessage}.${encodedSignature}`;
}

// node_modules/.pnpm/universal-github-app-jwt@2.2.2/node_modules/universal-github-app-jwt/index.js
async function githubAppJwt({
  id,
  privateKey,
  now = Math.floor(Date.now() / 1e3)
}) {
  const privateKeyWithNewlines = privateKey.replace(/\\n/g, "\n");
  const nowWithSafetyMargin = now - 30;
  const expiration = nowWithSafetyMargin + 60 * 10;
  const payload = {
    iat: nowWithSafetyMargin,
    // Issued at time
    exp: expiration,
    iss: id
  };
  const token = await getToken({
    privateKey: privateKeyWithNewlines,
    payload
  });
  return {
    appId: id,
    expiration,
    token
  };
}

// node_modules/.pnpm/toad-cache@3.7.0/node_modules/toad-cache/dist/toad-cache.mjs
var LruObject = class {
  constructor(max = 1e3, ttlInMsecs = 0) {
    if (isNaN(max) || max < 0) {
      throw new Error("Invalid max value");
    }
    if (isNaN(ttlInMsecs) || ttlInMsecs < 0) {
      throw new Error("Invalid ttl value");
    }
    this.first = null;
    this.items = /* @__PURE__ */ Object.create(null);
    this.last = null;
    this.size = 0;
    this.max = max;
    this.ttl = ttlInMsecs;
  }
  bumpLru(item) {
    if (this.last === item) {
      return;
    }
    const last = this.last;
    const next = item.next;
    const prev = item.prev;
    if (this.first === item) {
      this.first = next;
    }
    item.next = null;
    item.prev = last;
    last.next = item;
    if (prev !== null) {
      prev.next = next;
    }
    if (next !== null) {
      next.prev = prev;
    }
    this.last = item;
  }
  clear() {
    this.items = /* @__PURE__ */ Object.create(null);
    this.first = null;
    this.last = null;
    this.size = 0;
  }
  delete(key) {
    if (Object.prototype.hasOwnProperty.call(this.items, key)) {
      const item = this.items[key];
      delete this.items[key];
      this.size--;
      if (item.prev !== null) {
        item.prev.next = item.next;
      }
      if (item.next !== null) {
        item.next.prev = item.prev;
      }
      if (this.first === item) {
        this.first = item.next;
      }
      if (this.last === item) {
        this.last = item.prev;
      }
    }
  }
  deleteMany(keys) {
    for (var i = 0; i < keys.length; i++) {
      this.delete(keys[i]);
    }
  }
  evict() {
    if (this.size > 0) {
      const item = this.first;
      delete this.items[item.key];
      if (--this.size === 0) {
        this.first = null;
        this.last = null;
      } else {
        this.first = item.next;
        this.first.prev = null;
      }
    }
  }
  expiresAt(key) {
    if (Object.prototype.hasOwnProperty.call(this.items, key)) {
      return this.items[key].expiry;
    }
  }
  get(key) {
    if (Object.prototype.hasOwnProperty.call(this.items, key)) {
      const item = this.items[key];
      if (this.ttl > 0 && item.expiry <= Date.now()) {
        this.delete(key);
        return;
      }
      this.bumpLru(item);
      return item.value;
    }
  }
  getMany(keys) {
    const result = [];
    for (var i = 0; i < keys.length; i++) {
      result.push(this.get(keys[i]));
    }
    return result;
  }
  keys() {
    return Object.keys(this.items);
  }
  set(key, value) {
    if (Object.prototype.hasOwnProperty.call(this.items, key)) {
      const item2 = this.items[key];
      item2.value = value;
      item2.expiry = this.ttl > 0 ? Date.now() + this.ttl : this.ttl;
      if (this.last !== item2) {
        this.bumpLru(item2);
      }
      return;
    }
    if (this.max > 0 && this.size === this.max) {
      this.evict();
    }
    const item = {
      expiry: this.ttl > 0 ? Date.now() + this.ttl : this.ttl,
      key,
      prev: this.last,
      next: null,
      value
    };
    this.items[key] = item;
    if (++this.size === 1) {
      this.first = item;
    } else {
      this.last.next = item;
    }
    this.last = item;
  }
};

// node_modules/.pnpm/@octokit+auth-app@8.2.0/node_modules/@octokit/auth-app/dist-node/index.js
async function getAppAuthentication({
  appId,
  privateKey,
  timeDifference,
  createJwt
}) {
  try {
    if (createJwt) {
      const { jwt, expiresAt } = await createJwt(appId, timeDifference);
      return {
        type: "app",
        token: jwt,
        appId,
        expiresAt
      };
    }
    const authOptions = {
      id: appId,
      privateKey
    };
    if (timeDifference) {
      Object.assign(authOptions, {
        now: Math.floor(Date.now() / 1e3) + timeDifference
      });
    }
    const appAuthentication = await githubAppJwt(authOptions);
    return {
      type: "app",
      token: appAuthentication.token,
      appId: appAuthentication.appId,
      expiresAt: new Date(appAuthentication.expiration * 1e3).toISOString()
    };
  } catch (error) {
    if (privateKey === "-----BEGIN RSA PRIVATE KEY-----") {
      throw new Error(
        "The 'privateKey` option contains only the first line '-----BEGIN RSA PRIVATE KEY-----'. If you are setting it using a `.env` file, make sure it is set on a single line with newlines replaced by '\n'"
      );
    } else {
      throw error;
    }
  }
}
function getCache() {
  return new LruObject(
    // cache max. 15000 tokens, that will use less than 10mb memory
    15e3,
    // Cache for 1 minute less than GitHub expiry
    1e3 * 60 * 59
  );
}
async function get2(cache, options) {
  const cacheKey = optionsToCacheKey(options);
  const result = await cache.get(cacheKey);
  if (!result) {
    return;
  }
  const [
    token,
    createdAt,
    expiresAt,
    repositorySelection,
    permissionsString,
    singleFileName
  ] = result.split("|");
  const permissions = options.permissions || permissionsString.split(/,/).reduce((permissions2, string2) => {
    if (/!$/.test(string2)) {
      permissions2[string2.slice(0, -1)] = "write";
    } else {
      permissions2[string2] = "read";
    }
    return permissions2;
  }, {});
  return {
    token,
    createdAt,
    expiresAt,
    permissions,
    repositoryIds: options.repositoryIds,
    repositoryNames: options.repositoryNames,
    singleFileName,
    repositorySelection
  };
}
async function set2(cache, options, data) {
  const key = optionsToCacheKey(options);
  const permissionsString = options.permissions ? "" : Object.keys(data.permissions).map(
    (name2) => `${name2}${data.permissions[name2] === "write" ? "!" : ""}`
  ).join(",");
  const value = [
    data.token,
    data.createdAt,
    data.expiresAt,
    data.repositorySelection,
    permissionsString,
    data.singleFileName
  ].join("|");
  await cache.set(key, value);
}
function optionsToCacheKey({
  installationId,
  permissions = {},
  repositoryIds = [],
  repositoryNames = []
}) {
  const permissionsString = Object.keys(permissions).sort().map((name2) => permissions[name2] === "read" ? name2 : `${name2}!`).join(",");
  const repositoryIdsString = repositoryIds.sort().join(",");
  const repositoryNamesString = repositoryNames.join(",");
  return [
    installationId,
    repositoryIdsString,
    repositoryNamesString,
    permissionsString
  ].filter(Boolean).join("|");
}
function toTokenAuthentication({
  installationId,
  token,
  createdAt,
  expiresAt,
  repositorySelection,
  permissions,
  repositoryIds,
  repositoryNames,
  singleFileName
}) {
  return Object.assign(
    {
      type: "token",
      tokenType: "installation",
      token,
      installationId,
      permissions,
      createdAt,
      expiresAt,
      repositorySelection
    },
    repositoryIds ? { repositoryIds } : null,
    repositoryNames ? { repositoryNames } : null,
    singleFileName ? { singleFileName } : null
  );
}
async function getInstallationAuthentication(state, options, customRequest) {
  const installationId = Number(options.installationId || state.installationId);
  if (!installationId) {
    throw new Error(
      "[@octokit/auth-app] installationId option is required for installation authentication."
    );
  }
  if (options.factory) {
    const { type, factory, oauthApp, ...factoryAuthOptions } = {
      ...state,
      ...options
    };
    return factory(factoryAuthOptions);
  }
  const request2 = customRequest || state.request;
  return getInstallationAuthenticationConcurrently(
    state,
    { ...options, installationId },
    request2
  );
}
var pendingPromises = /* @__PURE__ */ new Map();
function getInstallationAuthenticationConcurrently(state, options, request2) {
  const cacheKey = optionsToCacheKey(options);
  if (pendingPromises.has(cacheKey)) {
    return pendingPromises.get(cacheKey);
  }
  const promise = getInstallationAuthenticationImpl(
    state,
    options,
    request2
  ).finally(() => pendingPromises.delete(cacheKey));
  pendingPromises.set(cacheKey, promise);
  return promise;
}
async function getInstallationAuthenticationImpl(state, options, request2) {
  if (!options.refresh) {
    const result = await get2(state.cache, options);
    if (result) {
      const {
        token: token2,
        createdAt: createdAt2,
        expiresAt: expiresAt2,
        permissions: permissions2,
        repositoryIds: repositoryIds2,
        repositoryNames: repositoryNames2,
        singleFileName: singleFileName2,
        repositorySelection: repositorySelection2
      } = result;
      return toTokenAuthentication({
        installationId: options.installationId,
        token: token2,
        createdAt: createdAt2,
        expiresAt: expiresAt2,
        permissions: permissions2,
        repositorySelection: repositorySelection2,
        repositoryIds: repositoryIds2,
        repositoryNames: repositoryNames2,
        singleFileName: singleFileName2
      });
    }
  }
  const appAuthentication = await getAppAuthentication(state);
  const payload = {
    installation_id: options.installationId,
    mediaType: {
      previews: ["machine-man"]
    },
    headers: {
      authorization: `bearer ${appAuthentication.token}`
    }
  };
  if (options.repositoryIds) {
    Object.assign(payload, { repository_ids: options.repositoryIds });
  }
  if (options.repositoryNames) {
    Object.assign(payload, {
      repositories: options.repositoryNames
    });
  }
  if (options.permissions) {
    Object.assign(payload, { permissions: options.permissions });
  }
  const {
    data: {
      token,
      expires_at: expiresAt,
      repositories,
      permissions: permissionsOptional,
      repository_selection: repositorySelectionOptional,
      single_file: singleFileName
    }
  } = await request2(
    "POST /app/installations/{installation_id}/access_tokens",
    payload
  );
  const permissions = permissionsOptional || {};
  const repositorySelection = repositorySelectionOptional || "all";
  const repositoryIds = repositories ? repositories.map((r) => r.id) : void 0;
  const repositoryNames = repositories ? repositories.map((repo) => repo.name) : void 0;
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const cacheOptions = {
    token,
    createdAt,
    expiresAt,
    repositorySelection,
    permissions,
    repositoryIds,
    repositoryNames
  };
  if (singleFileName) {
    Object.assign(payload, { singleFileName });
  }
  await set2(state.cache, options, cacheOptions);
  const cacheData = {
    installationId: options.installationId,
    token,
    createdAt,
    expiresAt,
    repositorySelection,
    permissions,
    repositoryIds,
    repositoryNames
  };
  if (singleFileName) {
    Object.assign(cacheData, { singleFileName });
  }
  return toTokenAuthentication(cacheData);
}
async function auth5(state, authOptions) {
  switch (authOptions.type) {
    case "app":
      return getAppAuthentication(state);
    case "oauth-app":
      return state.oauthApp({ type: "oauth-app" });
    case "installation":
      authOptions;
      return getInstallationAuthentication(state, {
        ...authOptions,
        type: "installation"
      });
    case "oauth-user":
      return state.oauthApp(authOptions);
    default:
      throw new Error(`Invalid auth type: ${authOptions.type}`);
  }
}
var PATHS = [
  "/app",
  "/app/hook/config",
  "/app/hook/deliveries",
  "/app/hook/deliveries/{delivery_id}",
  "/app/hook/deliveries/{delivery_id}/attempts",
  "/app/installations",
  "/app/installations/{installation_id}",
  "/app/installations/{installation_id}/access_tokens",
  "/app/installations/{installation_id}/suspended",
  "/app/installation-requests",
  "/marketplace_listing/accounts/{account_id}",
  "/marketplace_listing/plan",
  "/marketplace_listing/plans",
  "/marketplace_listing/plans/{plan_id}/accounts",
  "/marketplace_listing/stubbed/accounts/{account_id}",
  "/marketplace_listing/stubbed/plan",
  "/marketplace_listing/stubbed/plans",
  "/marketplace_listing/stubbed/plans/{plan_id}/accounts",
  "/orgs/{org}/installation",
  "/repos/{owner}/{repo}/installation",
  "/users/{username}/installation",
  "/enterprises/{enterprise}/installation"
];
function routeMatcher2(paths) {
  const regexes = paths.map(
    (p) => p.split("/").map((c) => c.startsWith("{") ? "(?:.+?)" : c).join("/")
  );
  const regex3 = `^(?:${regexes.map((r) => `(?:${r})`).join("|")})$`;
  return new RegExp(regex3, "i");
}
var REGEX = routeMatcher2(PATHS);
function requiresAppAuth(url2) {
  return !!url2 && REGEX.test(url2.split("?")[0]);
}
var FIVE_SECONDS_IN_MS = 5 * 1e3;
function isNotTimeSkewError(error) {
  return !(error.message.match(
    /'Expiration time' claim \('exp'\) is too far in the future/
  ) || error.message.match(
    /'Expiration time' claim \('exp'\) must be a numeric value representing the future time at which the assertion expires/
  ) || error.message.match(
    /'Issued at' claim \('iat'\) must be an Integer representing the time that the assertion was issued/
  ));
}
async function hook5(state, request2, route, parameters) {
  const endpoint2 = request2.endpoint.merge(route, parameters);
  const url2 = endpoint2.url;
  if (/\/login\/oauth\/access_token$/.test(url2)) {
    return request2(endpoint2);
  }
  if (requiresAppAuth(url2.replace(request2.endpoint.DEFAULTS.baseUrl, ""))) {
    const { token: token2 } = await getAppAuthentication(state);
    endpoint2.headers.authorization = `bearer ${token2}`;
    let response;
    try {
      response = await request2(endpoint2);
    } catch (error) {
      if (isNotTimeSkewError(error)) {
        throw error;
      }
      if (typeof error.response.headers.date === "undefined") {
        throw error;
      }
      const diff = Math.floor(
        (Date.parse(error.response.headers.date) - Date.parse((/* @__PURE__ */ new Date()).toString())) / 1e3
      );
      state.log.warn(error.message);
      state.log.warn(
        `[@octokit/auth-app] GitHub API time and system time are different by ${diff} seconds. Retrying request with the difference accounted for.`
      );
      const { token: token3 } = await getAppAuthentication({
        ...state,
        timeDifference: diff
      });
      endpoint2.headers.authorization = `bearer ${token3}`;
      return request2(endpoint2);
    }
    return response;
  }
  if (requiresBasicAuth(url2)) {
    const authentication = await state.oauthApp({ type: "oauth-app" });
    endpoint2.headers.authorization = authentication.headers.authorization;
    return request2(endpoint2);
  }
  const { token, createdAt } = await getInstallationAuthentication(
    state,
    // @ts-expect-error TBD
    {},
    request2.defaults({ baseUrl: endpoint2.baseUrl })
  );
  endpoint2.headers.authorization = `token ${token}`;
  return sendRequestWithRetries(
    state,
    request2,
    endpoint2,
    createdAt
  );
}
async function sendRequestWithRetries(state, request2, options, createdAt, retries = 0) {
  const timeSinceTokenCreationInMs = +/* @__PURE__ */ new Date() - +new Date(createdAt);
  try {
    return await request2(options);
  } catch (error) {
    if (error.status !== 401) {
      throw error;
    }
    if (timeSinceTokenCreationInMs >= FIVE_SECONDS_IN_MS) {
      if (retries > 0) {
        error.message = `After ${retries} retries within ${timeSinceTokenCreationInMs / 1e3}s of creating the installation access token, the response remains 401. At this point, the cause may be an authentication problem or a system outage. Please check https://www.githubstatus.com for status information`;
      }
      throw error;
    }
    ++retries;
    const awaitTime = retries * 1e3;
    state.log.warn(
      `[@octokit/auth-app] Retrying after 401 response to account for token replication delay (retry: ${retries}, wait: ${awaitTime / 1e3}s)`
    );
    await new Promise((resolve) => setTimeout(resolve, awaitTime));
    return sendRequestWithRetries(state, request2, options, createdAt, retries);
  }
}
var VERSION12 = "8.2.0";
function createAppAuth(options) {
  if (!options.appId) {
    throw new Error("[@octokit/auth-app] appId option is required");
  }
  if (!options.privateKey && !options.createJwt) {
    throw new Error("[@octokit/auth-app] privateKey option is required");
  } else if (options.privateKey && options.createJwt) {
    throw new Error(
      "[@octokit/auth-app] privateKey and createJwt options are mutually exclusive"
    );
  }
  if ("installationId" in options && !options.installationId) {
    throw new Error(
      "[@octokit/auth-app] installationId is set to a falsy value"
    );
  }
  const log = options.log || {};
  if (typeof log.warn !== "function") {
    log.warn = console.warn.bind(console);
  }
  const request2 = options.request || request.defaults({
    headers: {
      "user-agent": `octokit-auth-app.js/${VERSION12} ${getUserAgent()}`
    }
  });
  const state = Object.assign(
    {
      request: request2,
      cache: getCache()
    },
    options,
    options.installationId ? { installationId: Number(options.installationId) } : {},
    {
      log,
      oauthApp: createOAuthAppAuth({
        clientType: "github-app",
        clientId: options.clientId || "",
        clientSecret: options.clientSecret || "",
        request: request2
      })
    }
  );
  return Object.assign(auth5.bind(null, state), {
    hook: hook5.bind(null, state)
  });
}

// node_modules/.pnpm/@octokit+auth-unauthenticated@7.0.3/node_modules/@octokit/auth-unauthenticated/dist-node/index.js
async function auth6(reason) {
  return {
    type: "unauthenticated",
    reason
  };
}
function isRateLimitError(error) {
  if (error.status !== 403) {
    return false;
  }
  if (!error.response) {
    return false;
  }
  return error.response.headers["x-ratelimit-remaining"] === "0";
}
var REGEX_ABUSE_LIMIT_MESSAGE = /\babuse\b/i;
function isAbuseLimitError(error) {
  if (error.status !== 403) {
    return false;
  }
  return REGEX_ABUSE_LIMIT_MESSAGE.test(error.message);
}
async function hook6(reason, request2, route, parameters) {
  const endpoint2 = request2.endpoint.merge(
    route,
    parameters
  );
  return request2(endpoint2).catch((error) => {
    if (error.status === 404) {
      error.message = `Not found. May be due to lack of authentication. Reason: ${reason}`;
      throw error;
    }
    if (isRateLimitError(error)) {
      error.message = `API rate limit exceeded. This maybe caused by the lack of authentication. Reason: ${reason}`;
      throw error;
    }
    if (isAbuseLimitError(error)) {
      error.message = `You have triggered an abuse detection mechanism. This maybe caused by the lack of authentication. Reason: ${reason}`;
      throw error;
    }
    if (error.status === 401) {
      error.message = `Unauthorized. "${endpoint2.method} ${endpoint2.url}" failed most likely due to lack of authentication. Reason: ${reason}`;
      throw error;
    }
    if (error.status >= 400 && error.status < 500) {
      error.message = error.message.replace(
        /\.?$/,
        `. May be caused by lack of authentication (${reason}).`
      );
    }
    throw error;
  });
}
var createUnauthenticatedAuth = function createUnauthenticatedAuth2(options) {
  if (!options || !options.reason) {
    throw new Error(
      "[@octokit/auth-unauthenticated] No reason passed to createUnauthenticatedAuth"
    );
  }
  return Object.assign(auth6.bind(null, options.reason), {
    hook: hook6.bind(null, options.reason)
  });
};

// node_modules/.pnpm/@octokit+oauth-app@8.0.3/node_modules/@octokit/oauth-app/dist-node/index.js
var VERSION13 = "8.0.3";
function addEventHandler(state, eventName, eventHandler) {
  if (Array.isArray(eventName)) {
    for (const singleEventName of eventName) {
      addEventHandler(state, singleEventName, eventHandler);
    }
    return;
  }
  if (!state.eventHandlers[eventName]) {
    state.eventHandlers[eventName] = [];
  }
  state.eventHandlers[eventName].push(eventHandler);
}
var OAuthAppOctokit = Octokit.defaults({
  userAgent: `octokit-oauth-app.js/${VERSION13} ${getUserAgent()}`
});
async function emitEvent(state, context) {
  const { name: name2, action } = context;
  if (state.eventHandlers[`${name2}.${action}`]) {
    for (const eventHandler of state.eventHandlers[`${name2}.${action}`]) {
      await eventHandler(context);
    }
  }
  if (state.eventHandlers[name2]) {
    for (const eventHandler of state.eventHandlers[name2]) {
      await eventHandler(context);
    }
  }
}
async function getUserOctokitWithState(state, options) {
  return state.octokit.auth({
    type: "oauth-user",
    ...options,
    async factory(options2) {
      const octokit = new state.Octokit({
        authStrategy: createOAuthUserAuth,
        auth: options2
      });
      const authentication = await octokit.auth({
        type: "get"
      });
      await emitEvent(state, {
        name: "token",
        action: "created",
        token: authentication.token,
        scopes: authentication.scopes,
        authentication,
        octokit
      });
      return octokit;
    }
  });
}
function getWebFlowAuthorizationUrlWithState(state, options) {
  const optionsWithDefaults = {
    clientId: state.clientId,
    request: state.octokit.request,
    ...options,
    allowSignup: state.allowSignup ?? options.allowSignup,
    redirectUrl: options.redirectUrl ?? state.redirectUrl,
    scopes: options.scopes ?? state.defaultScopes
  };
  return getWebFlowAuthorizationUrl({
    clientType: state.clientType,
    ...optionsWithDefaults
  });
}
async function createTokenWithState(state, options) {
  const authentication = await state.octokit.auth({
    type: "oauth-user",
    ...options
  });
  await emitEvent(state, {
    name: "token",
    action: "created",
    token: authentication.token,
    scopes: authentication.scopes,
    authentication,
    octokit: new state.Octokit({
      authStrategy: createOAuthUserAuth,
      auth: {
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        token: authentication.token,
        scopes: authentication.scopes,
        refreshToken: authentication.refreshToken,
        expiresAt: authentication.expiresAt,
        refreshTokenExpiresAt: authentication.refreshTokenExpiresAt
      }
    })
  });
  return { authentication };
}
async function checkTokenWithState(state, options) {
  const result = await checkToken({
    // @ts-expect-error not worth the extra code to appease TS
    clientType: state.clientType,
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options
  });
  Object.assign(result.authentication, { type: "token", tokenType: "oauth" });
  return result;
}
async function resetTokenWithState(state, options) {
  const optionsWithDefaults = {
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options
  };
  if (state.clientType === "oauth-app") {
    const response2 = await resetToken({
      clientType: "oauth-app",
      ...optionsWithDefaults
    });
    const authentication2 = Object.assign(response2.authentication, {
      type: "token",
      tokenType: "oauth"
    });
    await emitEvent(state, {
      name: "token",
      action: "reset",
      token: response2.authentication.token,
      scopes: response2.authentication.scopes || void 0,
      authentication: authentication2,
      octokit: new state.Octokit({
        authStrategy: createOAuthUserAuth,
        auth: {
          clientType: state.clientType,
          clientId: state.clientId,
          clientSecret: state.clientSecret,
          token: response2.authentication.token,
          scopes: response2.authentication.scopes
        }
      })
    });
    return { ...response2, authentication: authentication2 };
  }
  const response = await resetToken({
    clientType: "github-app",
    ...optionsWithDefaults
  });
  const authentication = Object.assign(response.authentication, {
    type: "token",
    tokenType: "oauth"
  });
  await emitEvent(state, {
    name: "token",
    action: "reset",
    token: response.authentication.token,
    authentication,
    octokit: new state.Octokit({
      authStrategy: createOAuthUserAuth,
      auth: {
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        token: response.authentication.token
      }
    })
  });
  return { ...response, authentication };
}
async function refreshTokenWithState(state, options) {
  if (state.clientType === "oauth-app") {
    throw new Error(
      "[@octokit/oauth-app] app.refreshToken() is not supported for OAuth Apps"
    );
  }
  const response = await refreshToken({
    clientType: "github-app",
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    refreshToken: options.refreshToken
  });
  const authentication = Object.assign(response.authentication, {
    type: "token",
    tokenType: "oauth"
  });
  await emitEvent(state, {
    name: "token",
    action: "refreshed",
    token: response.authentication.token,
    authentication,
    octokit: new state.Octokit({
      authStrategy: createOAuthUserAuth,
      auth: {
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        token: response.authentication.token
      }
    })
  });
  return { ...response, authentication };
}
async function scopeTokenWithState(state, options) {
  if (state.clientType === "oauth-app") {
    throw new Error(
      "[@octokit/oauth-app] app.scopeToken() is not supported for OAuth Apps"
    );
  }
  const response = await scopeToken({
    clientType: "github-app",
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options
  });
  const authentication = Object.assign(response.authentication, {
    type: "token",
    tokenType: "oauth"
  });
  await emitEvent(state, {
    name: "token",
    action: "scoped",
    token: response.authentication.token,
    authentication,
    octokit: new state.Octokit({
      authStrategy: createOAuthUserAuth,
      auth: {
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        token: response.authentication.token
      }
    })
  });
  return { ...response, authentication };
}
async function deleteTokenWithState(state, options) {
  const optionsWithDefaults = {
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options
  };
  const response = state.clientType === "oauth-app" ? await deleteToken({
    clientType: "oauth-app",
    ...optionsWithDefaults
  }) : (
    /* v8 ignore next 4 */
    await deleteToken({
      clientType: "github-app",
      ...optionsWithDefaults
    })
  );
  await emitEvent(state, {
    name: "token",
    action: "deleted",
    token: options.token,
    octokit: new state.Octokit({
      authStrategy: createUnauthenticatedAuth,
      auth: {
        reason: `Handling "token.deleted" event. The access for the token has been revoked.`
      }
    })
  });
  return response;
}
async function deleteAuthorizationWithState(state, options) {
  const optionsWithDefaults = {
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    request: state.octokit.request,
    ...options
  };
  const response = state.clientType === "oauth-app" ? await deleteAuthorization({
    clientType: "oauth-app",
    ...optionsWithDefaults
  }) : (
    /* v8 ignore next 4 */
    await deleteAuthorization({
      clientType: "github-app",
      ...optionsWithDefaults
    })
  );
  await emitEvent(state, {
    name: "token",
    action: "deleted",
    token: options.token,
    octokit: new state.Octokit({
      authStrategy: createUnauthenticatedAuth,
      auth: {
        reason: `Handling "token.deleted" event. The access for the token has been revoked.`
      }
    })
  });
  await emitEvent(state, {
    name: "authorization",
    action: "deleted",
    token: options.token,
    octokit: new state.Octokit({
      authStrategy: createUnauthenticatedAuth,
      auth: {
        reason: `Handling "authorization.deleted" event. The access for the app has been revoked.`
      }
    })
  });
  return response;
}
var OAuthApp = class {
  static VERSION = VERSION13;
  static defaults(defaults) {
    const OAuthAppWithDefaults = class extends this {
      constructor(...args) {
        super({
          ...defaults,
          ...args[0]
        });
      }
    };
    return OAuthAppWithDefaults;
  }
  constructor(options) {
    const Octokit22 = options.Octokit || OAuthAppOctokit;
    this.type = options.clientType || "oauth-app";
    const octokit = new Octokit22({
      authStrategy: createOAuthAppAuth,
      auth: {
        clientType: this.type,
        clientId: options.clientId,
        clientSecret: options.clientSecret
      }
    });
    const state = {
      clientType: this.type,
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      // @ts-expect-error defaultScopes not permitted for GitHub Apps
      defaultScopes: options.defaultScopes || [],
      allowSignup: options.allowSignup,
      baseUrl: options.baseUrl,
      redirectUrl: options.redirectUrl,
      log: options.log,
      Octokit: Octokit22,
      octokit,
      eventHandlers: {}
    };
    this.on = addEventHandler.bind(null, state);
    this.octokit = octokit;
    this.getUserOctokit = getUserOctokitWithState.bind(
      null,
      state
    );
    this.getWebFlowAuthorizationUrl = getWebFlowAuthorizationUrlWithState.bind(
      null,
      state
    );
    this.createToken = createTokenWithState.bind(
      null,
      state
    );
    this.checkToken = checkTokenWithState.bind(
      null,
      state
    );
    this.resetToken = resetTokenWithState.bind(
      null,
      state
    );
    this.refreshToken = refreshTokenWithState.bind(
      null,
      state
    );
    this.scopeToken = scopeTokenWithState.bind(
      null,
      state
    );
    this.deleteToken = deleteTokenWithState.bind(null, state);
    this.deleteAuthorization = deleteAuthorizationWithState.bind(null, state);
  }
  // assigned during constructor
  type;
  on;
  octokit;
  getUserOctokit;
  getWebFlowAuthorizationUrl;
  createToken;
  checkToken;
  resetToken;
  refreshToken;
  scopeToken;
  deleteToken;
  deleteAuthorization;
};

// node_modules/.pnpm/@octokit+webhooks-methods@6.0.0/node_modules/@octokit/webhooks-methods/dist-node/index.js
import { createHmac } from "node:crypto";
import { timingSafeEqual } from "node:crypto";
import { Buffer as Buffer2 } from "node:buffer";
var VERSION14 = "6.0.0";
async function sign(secret, payload) {
  if (!secret || !payload) {
    throw new TypeError(
      "[@octokit/webhooks-methods] secret & payload required for sign()"
    );
  }
  if (typeof payload !== "string") {
    throw new TypeError("[@octokit/webhooks-methods] payload must be a string");
  }
  const algorithm = "sha256";
  return `${algorithm}=${createHmac(algorithm, secret).update(payload).digest("hex")}`;
}
sign.VERSION = VERSION14;
async function verify(secret, eventPayload, signature) {
  if (!secret || !eventPayload || !signature) {
    throw new TypeError(
      "[@octokit/webhooks-methods] secret, eventPayload & signature required"
    );
  }
  if (typeof eventPayload !== "string") {
    throw new TypeError(
      "[@octokit/webhooks-methods] eventPayload must be a string"
    );
  }
  const signatureBuffer = Buffer2.from(signature);
  const verificationBuffer = Buffer2.from(await sign(secret, eventPayload));
  if (signatureBuffer.length !== verificationBuffer.length) {
    return false;
  }
  return timingSafeEqual(signatureBuffer, verificationBuffer);
}
verify.VERSION = VERSION14;
async function verifyWithFallback(secret, payload, signature, additionalSecrets) {
  const firstPass = await verify(secret, payload, signature);
  if (firstPass) {
    return true;
  }
  if (additionalSecrets !== void 0) {
    for (const s of additionalSecrets) {
      const v = await verify(s, payload, signature);
      if (v) {
        return v;
      }
    }
  }
  return false;
}

// node_modules/.pnpm/@octokit+webhooks@14.2.0/node_modules/@octokit/webhooks/dist-bundle/index.js
var createLogger2 = (logger = {}) => {
  if (typeof logger.debug !== "function") {
    logger.debug = () => {
    };
  }
  if (typeof logger.info !== "function") {
    logger.info = () => {
    };
  }
  if (typeof logger.warn !== "function") {
    logger.warn = console.warn.bind(console);
  }
  if (typeof logger.error !== "function") {
    logger.error = console.error.bind(console);
  }
  return logger;
};
var emitterEventNames = [
  "branch_protection_configuration",
  "branch_protection_configuration.disabled",
  "branch_protection_configuration.enabled",
  "branch_protection_rule",
  "branch_protection_rule.created",
  "branch_protection_rule.deleted",
  "branch_protection_rule.edited",
  "check_run",
  "check_run.completed",
  "check_run.created",
  "check_run.requested_action",
  "check_run.rerequested",
  "check_suite",
  "check_suite.completed",
  "check_suite.requested",
  "check_suite.rerequested",
  "code_scanning_alert",
  "code_scanning_alert.appeared_in_branch",
  "code_scanning_alert.closed_by_user",
  "code_scanning_alert.created",
  "code_scanning_alert.fixed",
  "code_scanning_alert.reopened",
  "code_scanning_alert.reopened_by_user",
  "commit_comment",
  "commit_comment.created",
  "create",
  "custom_property",
  "custom_property.created",
  "custom_property.deleted",
  "custom_property.promote_to_enterprise",
  "custom_property.updated",
  "custom_property_values",
  "custom_property_values.updated",
  "delete",
  "dependabot_alert",
  "dependabot_alert.auto_dismissed",
  "dependabot_alert.auto_reopened",
  "dependabot_alert.created",
  "dependabot_alert.dismissed",
  "dependabot_alert.fixed",
  "dependabot_alert.reintroduced",
  "dependabot_alert.reopened",
  "deploy_key",
  "deploy_key.created",
  "deploy_key.deleted",
  "deployment",
  "deployment.created",
  "deployment_protection_rule",
  "deployment_protection_rule.requested",
  "deployment_review",
  "deployment_review.approved",
  "deployment_review.rejected",
  "deployment_review.requested",
  "deployment_status",
  "deployment_status.created",
  "discussion",
  "discussion.answered",
  "discussion.category_changed",
  "discussion.closed",
  "discussion.created",
  "discussion.deleted",
  "discussion.edited",
  "discussion.labeled",
  "discussion.locked",
  "discussion.pinned",
  "discussion.reopened",
  "discussion.transferred",
  "discussion.unanswered",
  "discussion.unlabeled",
  "discussion.unlocked",
  "discussion.unpinned",
  "discussion_comment",
  "discussion_comment.created",
  "discussion_comment.deleted",
  "discussion_comment.edited",
  "fork",
  "github_app_authorization",
  "github_app_authorization.revoked",
  "gollum",
  "installation",
  "installation.created",
  "installation.deleted",
  "installation.new_permissions_accepted",
  "installation.suspend",
  "installation.unsuspend",
  "installation_repositories",
  "installation_repositories.added",
  "installation_repositories.removed",
  "installation_target",
  "installation_target.renamed",
  "issue_comment",
  "issue_comment.created",
  "issue_comment.deleted",
  "issue_comment.edited",
  "issue_dependencies",
  "issue_dependencies.blocked_by_added",
  "issue_dependencies.blocked_by_removed",
  "issue_dependencies.blocking_added",
  "issue_dependencies.blocking_removed",
  "issues",
  "issues.assigned",
  "issues.closed",
  "issues.deleted",
  "issues.demilestoned",
  "issues.edited",
  "issues.labeled",
  "issues.locked",
  "issues.milestoned",
  "issues.opened",
  "issues.pinned",
  "issues.reopened",
  "issues.transferred",
  "issues.typed",
  "issues.unassigned",
  "issues.unlabeled",
  "issues.unlocked",
  "issues.unpinned",
  "issues.untyped",
  "label",
  "label.created",
  "label.deleted",
  "label.edited",
  "marketplace_purchase",
  "marketplace_purchase.cancelled",
  "marketplace_purchase.changed",
  "marketplace_purchase.pending_change",
  "marketplace_purchase.pending_change_cancelled",
  "marketplace_purchase.purchased",
  "member",
  "member.added",
  "member.edited",
  "member.removed",
  "membership",
  "membership.added",
  "membership.removed",
  "merge_group",
  "merge_group.checks_requested",
  "merge_group.destroyed",
  "meta",
  "meta.deleted",
  "milestone",
  "milestone.closed",
  "milestone.created",
  "milestone.deleted",
  "milestone.edited",
  "milestone.opened",
  "org_block",
  "org_block.blocked",
  "org_block.unblocked",
  "organization",
  "organization.deleted",
  "organization.member_added",
  "organization.member_invited",
  "organization.member_removed",
  "organization.renamed",
  "package",
  "package.published",
  "package.updated",
  "page_build",
  "personal_access_token_request",
  "personal_access_token_request.approved",
  "personal_access_token_request.cancelled",
  "personal_access_token_request.created",
  "personal_access_token_request.denied",
  "ping",
  "project",
  "project.closed",
  "project.created",
  "project.deleted",
  "project.edited",
  "project.reopened",
  "project_card",
  "project_card.converted",
  "project_card.created",
  "project_card.deleted",
  "project_card.edited",
  "project_card.moved",
  "project_column",
  "project_column.created",
  "project_column.deleted",
  "project_column.edited",
  "project_column.moved",
  "projects_v2",
  "projects_v2.closed",
  "projects_v2.created",
  "projects_v2.deleted",
  "projects_v2.edited",
  "projects_v2.reopened",
  "projects_v2_item",
  "projects_v2_item.archived",
  "projects_v2_item.converted",
  "projects_v2_item.created",
  "projects_v2_item.deleted",
  "projects_v2_item.edited",
  "projects_v2_item.reordered",
  "projects_v2_item.restored",
  "projects_v2_status_update",
  "projects_v2_status_update.created",
  "projects_v2_status_update.deleted",
  "projects_v2_status_update.edited",
  "public",
  "pull_request",
  "pull_request.assigned",
  "pull_request.auto_merge_disabled",
  "pull_request.auto_merge_enabled",
  "pull_request.closed",
  "pull_request.converted_to_draft",
  "pull_request.demilestoned",
  "pull_request.dequeued",
  "pull_request.edited",
  "pull_request.enqueued",
  "pull_request.labeled",
  "pull_request.locked",
  "pull_request.milestoned",
  "pull_request.opened",
  "pull_request.ready_for_review",
  "pull_request.reopened",
  "pull_request.review_request_removed",
  "pull_request.review_requested",
  "pull_request.synchronize",
  "pull_request.unassigned",
  "pull_request.unlabeled",
  "pull_request.unlocked",
  "pull_request_review",
  "pull_request_review.dismissed",
  "pull_request_review.edited",
  "pull_request_review.submitted",
  "pull_request_review_comment",
  "pull_request_review_comment.created",
  "pull_request_review_comment.deleted",
  "pull_request_review_comment.edited",
  "pull_request_review_thread",
  "pull_request_review_thread.resolved",
  "pull_request_review_thread.unresolved",
  "push",
  "registry_package",
  "registry_package.published",
  "registry_package.updated",
  "release",
  "release.created",
  "release.deleted",
  "release.edited",
  "release.prereleased",
  "release.published",
  "release.released",
  "release.unpublished",
  "repository",
  "repository.archived",
  "repository.created",
  "repository.deleted",
  "repository.edited",
  "repository.privatized",
  "repository.publicized",
  "repository.renamed",
  "repository.transferred",
  "repository.unarchived",
  "repository_advisory",
  "repository_advisory.published",
  "repository_advisory.reported",
  "repository_dispatch",
  "repository_dispatch.sample.collected",
  "repository_import",
  "repository_ruleset",
  "repository_ruleset.created",
  "repository_ruleset.deleted",
  "repository_ruleset.edited",
  "repository_vulnerability_alert",
  "repository_vulnerability_alert.create",
  "repository_vulnerability_alert.dismiss",
  "repository_vulnerability_alert.reopen",
  "repository_vulnerability_alert.resolve",
  "secret_scanning_alert",
  "secret_scanning_alert.assigned",
  "secret_scanning_alert.created",
  "secret_scanning_alert.publicly_leaked",
  "secret_scanning_alert.reopened",
  "secret_scanning_alert.resolved",
  "secret_scanning_alert.unassigned",
  "secret_scanning_alert.validated",
  "secret_scanning_alert_location",
  "secret_scanning_alert_location.created",
  "secret_scanning_scan",
  "secret_scanning_scan.completed",
  "security_advisory",
  "security_advisory.published",
  "security_advisory.updated",
  "security_advisory.withdrawn",
  "security_and_analysis",
  "sponsorship",
  "sponsorship.cancelled",
  "sponsorship.created",
  "sponsorship.edited",
  "sponsorship.pending_cancellation",
  "sponsorship.pending_tier_change",
  "sponsorship.tier_changed",
  "star",
  "star.created",
  "star.deleted",
  "status",
  "sub_issues",
  "sub_issues.parent_issue_added",
  "sub_issues.parent_issue_removed",
  "sub_issues.sub_issue_added",
  "sub_issues.sub_issue_removed",
  "team",
  "team.added_to_repository",
  "team.created",
  "team.deleted",
  "team.edited",
  "team.removed_from_repository",
  "team_add",
  "watch",
  "watch.started",
  "workflow_dispatch",
  "workflow_job",
  "workflow_job.completed",
  "workflow_job.in_progress",
  "workflow_job.queued",
  "workflow_job.waiting",
  "workflow_run",
  "workflow_run.completed",
  "workflow_run.in_progress",
  "workflow_run.requested"
];
function validateEventName(eventName, options = {}) {
  if (typeof eventName !== "string") {
    throw new TypeError("eventName must be of type string");
  }
  if (eventName === "*") {
    throw new TypeError(
      `Using the "*" event with the regular Webhooks.on() function is not supported. Please use the Webhooks.onAny() method instead`
    );
  }
  if (eventName === "error") {
    throw new TypeError(
      `Using the "error" event with the regular Webhooks.on() function is not supported. Please use the Webhooks.onError() method instead`
    );
  }
  if (options.onUnknownEventName === "ignore") {
    return;
  }
  if (!emitterEventNames.includes(eventName)) {
    if (options.onUnknownEventName !== "warn") {
      throw new TypeError(
        `"${eventName}" is not a known webhook name (https://developer.github.com/v3/activity/events/types/)`
      );
    } else {
      (options.log || console).warn(
        `"${eventName}" is not a known webhook name (https://developer.github.com/v3/activity/events/types/)`
      );
    }
  }
}
function handleEventHandlers(state, webhookName, handler2) {
  if (!state.hooks[webhookName]) {
    state.hooks[webhookName] = [];
  }
  state.hooks[webhookName].push(handler2);
}
function receiverOn(state, webhookNameOrNames, handler2) {
  if (Array.isArray(webhookNameOrNames)) {
    webhookNameOrNames.forEach(
      (webhookName) => receiverOn(state, webhookName, handler2)
    );
    return;
  }
  validateEventName(webhookNameOrNames, {
    onUnknownEventName: "warn",
    log: state.log
  });
  handleEventHandlers(state, webhookNameOrNames, handler2);
}
function receiverOnAny(state, handler2) {
  handleEventHandlers(state, "*", handler2);
}
function receiverOnError(state, handler2) {
  handleEventHandlers(state, "error", handler2);
}
function wrapErrorHandler(handler2, error) {
  let returnValue;
  try {
    returnValue = handler2(error);
  } catch (error2) {
    console.log('FATAL: Error occurred in "error" event handler');
    console.log(error2);
  }
  if (returnValue && returnValue.catch) {
    returnValue.catch((error2) => {
      console.log('FATAL: Error occurred in "error" event handler');
      console.log(error2);
    });
  }
}
function getHooks(state, eventPayloadAction, eventName) {
  const hooks = [state.hooks[eventName], state.hooks["*"]];
  if (eventPayloadAction) {
    hooks.unshift(state.hooks[`${eventName}.${eventPayloadAction}`]);
  }
  return [].concat(...hooks.filter(Boolean));
}
function receiverHandle(state, event2) {
  const errorHandlers = state.hooks.error || [];
  if (event2 instanceof Error) {
    const error = Object.assign(new AggregateError([event2], event2.message), {
      event: event2
    });
    errorHandlers.forEach((handler2) => wrapErrorHandler(handler2, error));
    return Promise.reject(error);
  }
  if (!event2 || !event2.name) {
    const error = new Error("Event name not passed");
    throw new AggregateError([error], error.message);
  }
  if (!event2.payload) {
    const error = new Error("Event name not passed");
    throw new AggregateError([error], error.message);
  }
  const hooks = getHooks(
    state,
    "action" in event2.payload ? event2.payload.action : null,
    event2.name
  );
  if (hooks.length === 0) {
    return Promise.resolve();
  }
  const errors = [];
  const promises = hooks.map((handler2) => {
    let promise = Promise.resolve(event2);
    if (state.transform) {
      promise = promise.then(state.transform);
    }
    return promise.then((event22) => {
      return handler2(event22);
    }).catch((error) => errors.push(Object.assign(error, { event: event2 })));
  });
  return Promise.all(promises).then(() => {
    if (errors.length === 0) {
      return;
    }
    const error = new AggregateError(
      errors,
      errors.map((error2) => error2.message).join("\n")
    );
    Object.assign(error, {
      event: event2
    });
    errorHandlers.forEach((handler2) => wrapErrorHandler(handler2, error));
    throw error;
  });
}
function removeListener(state, webhookNameOrNames, handler2) {
  if (Array.isArray(webhookNameOrNames)) {
    webhookNameOrNames.forEach(
      (webhookName) => removeListener(state, webhookName, handler2)
    );
    return;
  }
  if (!state.hooks[webhookNameOrNames]) {
    return;
  }
  for (let i = state.hooks[webhookNameOrNames].length - 1; i >= 0; i--) {
    if (state.hooks[webhookNameOrNames][i] === handler2) {
      state.hooks[webhookNameOrNames].splice(i, 1);
      return;
    }
  }
}
function createEventHandler(options) {
  const state = {
    hooks: {},
    log: createLogger2(options && options.log)
  };
  if (options && options.transform) {
    state.transform = options.transform;
  }
  return {
    on: receiverOn.bind(null, state),
    onAny: receiverOnAny.bind(null, state),
    onError: receiverOnError.bind(null, state),
    removeListener: removeListener.bind(null, state),
    receive: receiverHandle.bind(null, state)
  };
}
async function verifyAndReceive(state, event2) {
  const matchesSignature = await verifyWithFallback(
    state.secret,
    event2.payload,
    event2.signature,
    state.additionalSecrets
  ).catch(() => false);
  if (!matchesSignature) {
    const error = new Error(
      "[@octokit/webhooks] signature does not match event payload and secret"
    );
    error.event = event2;
    error.status = 400;
    return state.eventHandler.receive(error);
  }
  let payload;
  try {
    payload = JSON.parse(event2.payload);
  } catch (error) {
    error.message = "Invalid JSON";
    error.status = 400;
    throw new AggregateError([error], error.message);
  }
  return state.eventHandler.receive({
    id: event2.id,
    name: event2.name,
    payload
  });
}
var textDecoder = new TextDecoder("utf-8", { fatal: false });
var decode = textDecoder.decode.bind(textDecoder);
var Webhooks = class {
  sign;
  verify;
  on;
  onAny;
  onError;
  removeListener;
  receive;
  verifyAndReceive;
  constructor(options) {
    if (!options || !options.secret) {
      throw new Error("[@octokit/webhooks] options.secret required");
    }
    const state = {
      eventHandler: createEventHandler(options),
      secret: options.secret,
      additionalSecrets: options.additionalSecrets,
      hooks: {},
      log: createLogger2(options.log)
    };
    this.sign = sign.bind(null, options.secret);
    this.verify = verify.bind(null, options.secret);
    this.on = state.eventHandler.on;
    this.onAny = state.eventHandler.onAny;
    this.onError = state.eventHandler.onError;
    this.removeListener = state.eventHandler.removeListener;
    this.receive = state.eventHandler.receive;
    this.verifyAndReceive = verifyAndReceive.bind(null, state);
  }
};

// node_modules/.pnpm/@octokit+app@16.1.2/node_modules/@octokit/app/dist-node/index.js
var VERSION15 = "16.1.2";
function webhooks(appOctokit, options) {
  return new Webhooks({
    secret: options.secret,
    transform: async (event2) => {
      if (!("installation" in event2.payload) || typeof event2.payload.installation !== "object") {
        const octokit2 = new appOctokit.constructor({
          authStrategy: createUnauthenticatedAuth,
          auth: {
            reason: `"installation" key missing in webhook event payload`
          }
        });
        return {
          ...event2,
          octokit: octokit2
        };
      }
      const installationId = event2.payload.installation.id;
      const octokit = await appOctokit.auth({
        type: "installation",
        installationId,
        factory(auth7) {
          return new auth7.octokit.constructor({
            ...auth7.octokitOptions,
            authStrategy: createAppAuth,
            ...{
              auth: {
                ...auth7,
                installationId
              }
            }
          });
        }
      });
      octokit.hook.before("request", (options2) => {
        options2.headers["x-github-delivery"] = event2.id;
      });
      return {
        ...event2,
        octokit
      };
    }
  });
}
async function getInstallationOctokit(app, installationId) {
  return app.octokit.auth({
    type: "installation",
    installationId,
    factory(auth7) {
      const options = {
        ...auth7.octokitOptions,
        authStrategy: createAppAuth,
        ...{ auth: { ...auth7, installationId } }
      };
      return new auth7.octokit.constructor(options);
    }
  });
}
function eachInstallationFactory(app) {
  return Object.assign(eachInstallation.bind(null, app), {
    iterator: eachInstallationIterator.bind(null, app)
  });
}
async function eachInstallation(app, callback) {
  const i = eachInstallationIterator(app)[Symbol.asyncIterator]();
  let result = await i.next();
  while (!result.done) {
    await callback(result.value);
    result = await i.next();
  }
}
function eachInstallationIterator(app) {
  return {
    async *[Symbol.asyncIterator]() {
      const iterator2 = composePaginateRest.iterator(
        app.octokit,
        "GET /app/installations"
      );
      for await (const { data: installations } of iterator2) {
        for (const installation of installations) {
          const installationOctokit = await getInstallationOctokit(
            app,
            installation.id
          );
          yield { octokit: installationOctokit, installation };
        }
      }
    }
  };
}
function eachRepositoryFactory(app) {
  return Object.assign(eachRepository.bind(null, app), {
    iterator: eachRepositoryIterator.bind(null, app)
  });
}
async function eachRepository(app, queryOrCallback, callback) {
  const i = eachRepositoryIterator(
    app,
    callback ? queryOrCallback : void 0
  )[Symbol.asyncIterator]();
  let result = await i.next();
  while (!result.done) {
    if (callback) {
      await callback(result.value);
    } else {
      await queryOrCallback(result.value);
    }
    result = await i.next();
  }
}
function singleInstallationIterator(app, installationId) {
  return {
    async *[Symbol.asyncIterator]() {
      yield {
        octokit: await app.getInstallationOctokit(installationId)
      };
    }
  };
}
function eachRepositoryIterator(app, query) {
  return {
    async *[Symbol.asyncIterator]() {
      const iterator2 = query ? singleInstallationIterator(app, query.installationId) : app.eachInstallation.iterator();
      for await (const { octokit } of iterator2) {
        const repositoriesIterator = composePaginateRest.iterator(
          octokit,
          "GET /installation/repositories"
        );
        for await (const { data: repositories } of repositoriesIterator) {
          for (const repository of repositories) {
            yield { octokit, repository };
          }
        }
      }
    }
  };
}
function getInstallationUrlFactory(app) {
  let installationUrlBasePromise;
  return async function getInstallationUrl(options = {}) {
    if (!installationUrlBasePromise) {
      installationUrlBasePromise = getInstallationUrlBase(app);
    }
    const installationUrlBase = await installationUrlBasePromise;
    const installationUrl = new URL(installationUrlBase);
    if (options.target_id !== void 0) {
      installationUrl.pathname += "/permissions";
      installationUrl.searchParams.append(
        "target_id",
        options.target_id.toFixed()
      );
    }
    if (options.state !== void 0) {
      installationUrl.searchParams.append("state", options.state);
    }
    return installationUrl.href;
  };
}
async function getInstallationUrlBase(app) {
  const { data: appInfo } = await app.octokit.request("GET /app");
  if (!appInfo) {
    throw new Error("[@octokit/app] unable to fetch metadata for app");
  }
  return `${appInfo.html_url}/installations/new`;
}
var App = class {
  static VERSION = VERSION15;
  static defaults(defaults) {
    const AppWithDefaults = class extends this {
      constructor(...args) {
        super({
          ...defaults,
          ...args[0]
        });
      }
    };
    return AppWithDefaults;
  }
  octokit;
  // @ts-ignore calling app.webhooks will throw a helpful error when options.webhooks is not set
  webhooks;
  // @ts-ignore calling app.oauth will throw a helpful error when options.oauth is not set
  oauth;
  getInstallationOctokit;
  eachInstallation;
  eachRepository;
  getInstallationUrl;
  log;
  constructor(options) {
    const Octokit3 = options.Octokit || Octokit;
    const authOptions = Object.assign(
      {
        appId: options.appId,
        privateKey: options.privateKey
      },
      options.oauth ? {
        clientId: options.oauth.clientId,
        clientSecret: options.oauth.clientSecret
      } : {}
    );
    const octokitOptions = {
      authStrategy: createAppAuth,
      auth: authOptions
    };
    if ("log" in options && typeof options.log !== "undefined") {
      octokitOptions.log = options.log;
    }
    this.octokit = new Octokit3(octokitOptions);
    this.log = Object.assign(
      {
        debug: () => {
        },
        info: () => {
        },
        warn: console.warn.bind(console),
        error: console.error.bind(console)
      },
      options.log
    );
    if (options.webhooks) {
      this.webhooks = webhooks(this.octokit, options.webhooks);
    } else {
      Object.defineProperty(this, "webhooks", {
        get() {
          throw new Error("[@octokit/app] webhooks option not set");
        }
      });
    }
    if (options.oauth) {
      this.oauth = new OAuthApp({
        ...options.oauth,
        clientType: "github-app",
        Octokit: Octokit3
      });
    } else {
      Object.defineProperty(this, "oauth", {
        get() {
          throw new Error(
            "[@octokit/app] oauth.clientId / oauth.clientSecret options are not set"
          );
        }
      });
    }
    this.getInstallationOctokit = getInstallationOctokit.bind(
      null,
      this
    );
    this.eachInstallation = eachInstallationFactory(
      this
    );
    this.eachRepository = eachRepositoryFactory(
      this
    );
    this.getInstallationUrl = getInstallationUrlFactory(this);
  }
};

// node_modules/.pnpm/octokit@5.0.5/node_modules/octokit/dist-bundle/index.js
var VERSION16 = "0.0.0-development";
var Octokit2 = Octokit.plugin(
  restEndpointMethods,
  paginateRest,
  paginateGraphQL,
  retry,
  throttling
).defaults({
  userAgent: `octokit.js/${VERSION16}`,
  throttle: {
    onRateLimit,
    onSecondaryRateLimit
  }
});
function onRateLimit(retryAfter, options, octokit) {
  octokit.log.warn(
    `Request quota exhausted for request ${options.method} ${options.url}`
  );
  if (options.request.retryCount === 0) {
    octokit.log.info(`Retrying after ${retryAfter} seconds!`);
    return true;
  }
}
function onSecondaryRateLimit(retryAfter, options, octokit) {
  octokit.log.warn(
    `SecondaryRateLimit detected for request ${options.method} ${options.url}`
  );
  if (options.request.retryCount === 0) {
    octokit.log.info(`Retrying after ${retryAfter} seconds!`);
    return true;
  }
}
var App2 = App.defaults({ Octokit: Octokit2 });
var OAuthApp2 = OAuthApp.defaults({ Octokit: Octokit2 });

// src/providers/search/github/index.ts
var github_code_search_response_schema = object({
  items: array(
    object({
      name: string(),
      path: string(),
      html_url: string(),
      score: number(),
      repository: object({
        full_name: string(),
        html_url: string()
      }),
      text_matches: optional(
        array(
          object({
            fragment: optional(string())
          })
        )
      )
    })
  )
});
var github_repository_search_response_schema = object({
  items: array(
    object({
      full_name: string(),
      html_url: string(),
      description: nullable(string()),
      stargazers_count: number(),
      forks_count: number(),
      pushed_at: string(),
      language: nullable(string()),
      score: number()
    })
  )
});
var github_user_search_response_schema = object({
  items: array(
    object({
      login: string(),
      html_url: string(),
      bio: optional(nullable(string())),
      type: string(),
      score: number()
    })
  )
});
var is_github_search_error = (error) => typeof error === "object" && error !== null;
var GitHubSearchProvider = class {
  name = "github";
  description = "Search for code on GitHub. This is ideal for finding code examples, tracking down function definitions, or locating files with specific names or paths. Supports advanced query syntax with qualifiers like `filename:`, `path:`, `repo:`, `user:`, `language:`, and `in:file`. For example, to find a file named `settings.json` in a `.claude` directory, you could use the query: `filename:settings.json path:.claude`";
  // Main search method for code search (default behavior)
  async search(params) {
    return this.search_code(params);
  }
  // Dedicated code search method with enhanced snippets
  async search_code(params) {
    const api_key = validate_api_key(
      config.search.github.api_key,
      this.name
    );
    const octokit = new Octokit2({ auth: api_key });
    const search_request = async () => {
      try {
        const response = await octokit.rest.search.code({
          q: params.query,
          per_page: params.limit ?? 10,
          // Request text matches for better snippets
          headers: {
            accept: "application/vnd.github.v3.text-match+json"
          }
        });
        const data = parse_provider_response(
          this.name,
          github_code_search_response_schema,
          response.data
        );
        return data.items.map((item) => {
          let snippet = `No snippet available for ${item.path}`;
          if (item.text_matches && item.text_matches.length > 0) {
            const fragments = item.text_matches.map((match) => match.fragment).filter(Boolean);
            if (fragments.length > 0) {
              snippet = fragments.slice(0, 2).join(" ... ");
            }
          }
          return {
            title: `${item.repository.full_name}/${item.path}`,
            url: item.html_url,
            snippet,
            score: item.score,
            source_provider: this.name,
            metadata: {
              repository: item.repository.full_name,
              file_path: item.path,
              file_name: item.name,
              search_type: "code"
            }
          };
        });
      } catch (error) {
        return this.handle_search_error(error);
      }
    };
    return retry_with_backoff(search_request);
  }
  // Dedicated repository search method with enhanced metadata
  async search_repositories(params) {
    const api_key = validate_api_key(
      config.search.github.api_key,
      this.name
    );
    const octokit = new Octokit2({ auth: api_key });
    const search_request = async () => {
      try {
        const response = await octokit.rest.search.repos({
          q: params.query,
          per_page: params.limit ?? 10,
          sort: params.sort
        });
        const data = parse_provider_response(
          this.name,
          github_repository_search_response_schema,
          response.data
        );
        return data.items.map((item) => {
          let snippet = item.description ?? "No description available.";
          if (item.language) {
            snippet += ` \u2022 Language: ${item.language}`;
          }
          snippet += ` \u2022 \u2B50 ${item.stargazers_count} \u2022 \u{1F374} ${item.forks_count}`;
          return {
            title: item.full_name,
            url: item.html_url,
            snippet,
            score: item.score,
            source_provider: this.name,
            metadata: {
              repository: item.full_name,
              language: item.language,
              stars: item.stargazers_count,
              forks: item.forks_count,
              last_push: item.pushed_at,
              search_type: "repository"
            }
          };
        });
      } catch (error) {
        return this.handle_search_error(error);
      }
    };
    return retry_with_backoff(search_request);
  }
  // Alias for backward compatibility
  async repository_search(params) {
    return this.search_repositories(params);
  }
  // User search method
  async search_users(params) {
    const api_key = validate_api_key(
      config.search.github.api_key,
      this.name
    );
    const octokit = new Octokit2({ auth: api_key });
    const search_request = async () => {
      try {
        const response = await octokit.rest.search.users({
          q: params.query,
          per_page: params.limit ?? 10
        });
        const data = parse_provider_response(
          this.name,
          github_user_search_response_schema,
          response.data
        );
        return data.items.map((user) => ({
          title: user.login,
          url: user.html_url,
          snippet: user.bio ?? `GitHub user: ${user.login} \u2022 ${user.type}`,
          score: user.score,
          source_provider: this.name,
          metadata: {
            username: user.login,
            user_type: user.type,
            search_type: "user"
          }
        }));
      } catch (error) {
        return this.handle_search_error(error);
      }
    };
    return retry_with_backoff(search_request);
  }
  // Centralized error handling
  handle_search_error(error) {
    const status = is_github_search_error(error) && typeof error.status === "number" ? error.status : 500;
    const message = is_github_search_error(error) && typeof error.message === "string" ? error.message : "An unexpected error occurred.";
    throw normalize_provider_http_error(this.name, status, message);
  }
};
var github_search_provider = new GitHubSearchProvider();

// src/providers/docs/context7/index.ts
var context7_search_response_schema = object({
  results: array(
    object({
      id: string(),
      title: string(),
      description: optional(string()),
      totalSnippets: optional(number()),
      trustScore: optional(number()),
      benchmarkScore: optional(number()),
      versions: optional(array(string()))
    })
  )
});
var MAX_ALTERNATIVES = 4;
var to_match = (result) => ({
  id: result.id,
  title: result.title,
  description: result.description,
  trust_score: result.trustScore,
  benchmark_score: result.benchmarkScore,
  total_snippets: result.totalSnippets,
  versions: result.versions?.length ? result.versions : void 0
});
var Context7Provider = class {
  name = "context7";
  description = "Up-to-date documentation and code examples for programming libraries and frameworks, from Context7.";
  headers(api_key) {
    return {
      Accept: "application/json, text/plain",
      Authorization: `Bearer ${api_key}`
    };
  }
  async search_libraries(library, query) {
    const api_key = validate_api_key(
      config.docs.context7.api_key,
      this.name
    );
    const params = new URLSearchParams({
      libraryName: library,
      query
    });
    return retry_with_backoff(async () => {
      try {
        const raw = await http_json(
          this.name,
          `${config.docs.context7.base_url}/libs/search?${params}`,
          {
            method: "GET",
            headers: this.headers(api_key),
            signal: AbortSignal.timeout(config.docs.context7.timeout)
          }
        );
        const data = parse_provider_response(
          this.name,
          context7_search_response_schema,
          raw
        );
        return data.results.map(to_match);
      } catch (error) {
        handle_provider_error(error, this.name, "search libraries");
      }
    });
  }
  async get_docs(params) {
    const api_key = validate_api_key(
      config.docs.context7.api_key,
      this.name
    );
    let library_id = params.library_id?.trim();
    let library;
    let alternatives = [];
    if (!library_id) {
      const name2 = params.library?.trim();
      if (!name2) {
        throw new ProviderError(
          "INVALID_INPUT" /* INVALID_INPUT */,
          'Give library (a name such as "next.js") or library_id (such as "/vercel/next.js")',
          this.name
        );
      }
      const matches = await this.search_libraries(name2, params.query);
      if (matches.length === 0) {
        throw new ProviderError(
          "INVALID_INPUT" /* INVALID_INPUT */,
          `Context7 has no library matching "${name2}"`,
          this.name
        );
      }
      [library, ...alternatives] = matches;
      alternatives = alternatives.slice(0, MAX_ALTERNATIVES);
      library_id = library.id;
    }
    const query_params = new URLSearchParams({
      libraryId: library_id,
      query: params.query,
      type: "txt"
    });
    const content = await retry_with_backoff(async () => {
      try {
        const raw = await http_json(
          this.name,
          `${config.docs.context7.base_url}/context?${query_params}`,
          {
            method: "GET",
            headers: this.headers(api_key),
            signal: AbortSignal.timeout(config.docs.context7.timeout)
          }
        );
        return typeof raw === "string" ? raw : JSON.stringify(raw);
      } catch (error) {
        handle_provider_error(
          error,
          this.name,
          "fetch documentation"
        );
      }
    });
    return {
      library_id,
      library,
      alternatives,
      content,
      source_provider: this.name
    };
  }
};

// src/providers/search/firecrawl/index.ts
var firecrawl_search_response_schema = object({
  success: boolean(),
  error: optional(string()),
  data: optional(
    object({
      web: optional(
        array(
          object({
            url: string(),
            title: optional(string()),
            description: optional(string()),
            position: optional(number())
          })
        )
      )
    })
  )
});
var time_range_tbs = {
  day: "qdr:d",
  week: "qdr:w",
  month: "qdr:m",
  year: "qdr:y"
};
var FirecrawlSearchProvider = class {
  name = "firecrawl";
  description = "Web search through Firecrawl: Google-like results with titles, URLs and page descriptions. Supports site:/-site: via include/exclude domains and time range. Pairs with web_extract firecrawl modes to read the pages it finds.";
  async search(params) {
    const api_key = validate_api_key(
      config.search.firecrawl.api_key,
      this.name
    );
    const parsed_query = parse_search_operators(params.query);
    const search_params = apply_search_operators(parsed_query);
    const search_request = async () => {
      try {
        const query = build_query_with_operators(
          search_params,
          params.include_domains,
          params.exclude_domains
        );
        const body = {
          query,
          limit: params.limit ?? 10,
          sources: ["web"]
        };
        if (params.time_range) {
          body.tbs = time_range_tbs[params.time_range];
        }
        const data = await make_firecrawl_request(
          this.name,
          config.search.firecrawl.base_url,
          api_key,
          body,
          config.search.firecrawl.timeout,
          firecrawl_search_response_schema
        );
        validate_firecrawl_response(
          data,
          this.name,
          "Firecrawl search failed"
        );
        return (data.data?.web ?? []).map((result) => ({
          title: result.title ?? result.url,
          url: result.url,
          snippet: result.description ?? "",
          source_provider: this.name
        }));
      } catch (error) {
        handle_provider_error(
          error,
          this.name,
          "fetch search results"
        );
      }
    };
    return retry_with_backoff(search_request);
  }
};

// src/providers/search/kagi/index.ts
var kagi_search_response_schema = object({
  data: array(unknown()),
  meta: optional(
    object({
      total_hits: optional(number()),
      api_balance: optional(number())
    })
  )
});
var is_kagi_search_result = (result) => typeof result === "object" && result !== null && "title" in result && "url" in result && typeof result.title === "string" && typeof result.url === "string" && (!("snippet" in result) || typeof result.snippet === "string" || result.snippet === null) && (!("rank" in result) || typeof result.rank === "number");
var KagiSearchProvider = class {
  name = "kagi";
  description = 'High-quality search with operators: site:, -site:, filetype:/ext:, intitle:, inurl:, inbody:, inpage:, lang:, loc:, before:, after:, +term, -term, "exact". Privacy-focused with specialized knowledge indexes. Best for research and technical documentation.';
  async search(params) {
    const api_key = validate_api_key(
      config.search.kagi.api_key,
      this.name
    );
    const parsed_query = parse_search_operators(params.query);
    const search_params = apply_search_operators(parsed_query);
    const search_request = async () => {
      try {
        const query = build_query_with_operators(
          search_params,
          params.include_domains,
          params.exclude_domains,
          { exclude_file_type: true, exclude_dates: true }
        );
        const query_params = new URLSearchParams({
          q: query,
          limit: (params.limit ?? 10).toString()
        });
        if (search_params.file_type) {
          query_params.append("file_type", search_params.file_type);
        }
        if (search_params.date_before || search_params.date_after) {
          const time_range = [];
          if (search_params.date_after) {
            time_range.push(`after:${search_params.date_after}`);
          }
          if (search_params.date_before) {
            time_range.push(`before:${search_params.date_before}`);
          }
          query_params.append("time_range", time_range.join(","));
        }
        const raw_data = await http_json(
          this.name,
          `${config.search.kagi.base_url}/search?${query_params}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bot ${api_key}`,
              Accept: "application/json"
            },
            signal: AbortSignal.timeout(config.search.kagi.timeout)
          }
        );
        const data = parse_provider_response(
          this.name,
          kagi_search_response_schema,
          raw_data
        );
        return data.data.filter(is_kagi_search_result).map((result) => ({
          title: result.title,
          url: result.url,
          snippet: result.snippet ?? "",
          score: result.rank,
          source_provider: this.name
        }));
      } catch (error) {
        handle_provider_error(
          error,
          this.name,
          "fetch search results"
        );
      }
    };
    return retry_with_backoff(search_request);
  }
};

// src/providers/search/tavily/index.ts
var tavily_search_response_schema = object({
  results: array(
    object({
      title: string(),
      url: string(),
      content: string(),
      raw_content: optional(nullable(string())),
      favicon: optional(string()),
      score: number()
    })
  ),
  response_time: optional(union([number(), string()])),
  request_id: optional(string()),
  auto_parameters: optional(record(string(), unknown())),
  usage: optional(
    object({
      credits: number()
    })
  )
});
var normalize_tavily_date = (date) => {
  if (/^\d{4}$/.test(date)) return `${date}-01-01`;
  if (/^\d{4}-\d{2}$/.test(date)) return `${date}-01`;
  return date;
};
var tavily_country_aliases = {
  uk: "united kingdom",
  us: "united states",
  usa: "united states"
};
var normalize_tavily_country = (location) => {
  const normalized = location.toLowerCase().replace(/-/g, " ");
  return tavily_country_aliases[normalized] ?? normalized;
};
var TavilySearchProvider = class {
  name = "tavily";
  description = "Search the web using Tavily Search API. Best for factual queries requiring reliable sources and citations. Supports domain filtering through API parameters (include_domains/exclude_domains). Provides high-quality results for technical, scientific, and academic topics. Use when you need verified information with strong citation support.";
  async search(params) {
    const api_key = validate_api_key(
      config.search.tavily.api_key,
      this.name
    );
    const parsed_query = parse_search_operators(params.query);
    const search_params = apply_search_operators(parsed_query);
    const search_request = async () => {
      try {
        const include_domains = [
          ...params.include_domains ?? [],
          ...search_params.include_domains ?? []
        ];
        const exclude_domains = [
          ...params.exclude_domains ?? [],
          ...search_params.exclude_domains ?? []
        ];
        const request_body = {
          query: sanitize_query(search_params.query),
          max_results: params.limit ?? 5,
          include_domains: include_domains.length > 0 ? include_domains : [],
          exclude_domains: exclude_domains.length > 0 ? exclude_domains : [],
          search_depth: params.search_depth ?? "basic",
          topic: params.topic ?? "general",
          include_favicon: true,
          include_usage: true
        };
        if (params.time_range) {
          request_body.time_range = params.time_range;
        }
        if (params.safe_search !== void 0) {
          request_body.safe_search = params.safe_search;
        }
        if (params.include_raw_content !== void 0) {
          request_body.include_raw_content = params.include_raw_content;
        }
        if (params.auto_parameters !== void 0) {
          request_body.auto_parameters = params.auto_parameters;
        }
        if (search_params.date_after) {
          request_body.start_date = normalize_tavily_date(
            search_params.date_after
          );
        }
        if (search_params.date_before) {
          request_body.end_date = normalize_tavily_date(
            search_params.date_before
          );
        }
        if (search_params.exact_phrases && search_params.exact_phrases.length > 0) {
          request_body.exact_match = true;
          const exact_query_parts = search_params.exact_phrases.map(
            (phrase) => `"${phrase}"`
          );
          request_body.query = `${request_body.query} ${exact_query_parts.join(" ")}`.trim();
        }
        if (search_params.location) {
          request_body.country = normalize_tavily_country(
            search_params.location
          );
        }
        const raw_data = await http_json(
          this.name,
          `${config.search.tavily.base_url}/search`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${api_key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(request_body)
          }
        );
        const data = parse_provider_response(
          this.name,
          tavily_search_response_schema,
          raw_data
        );
        return data.results.map((result) => ({
          title: result.title,
          url: result.url,
          snippet: result.content,
          score: result.score,
          source_provider: this.name,
          metadata: {
            ...params.include_raw_content && result.raw_content ? { raw_content: result.raw_content } : {},
            ...result.favicon ? { favicon: result.favicon } : {},
            ...data.request_id ? { request_id: data.request_id } : {},
            ...data.response_time !== void 0 ? { response_time: data.response_time } : {},
            ...data.auto_parameters ? { auto_parameters: data.auto_parameters } : {},
            ...data.usage ? { usage: data.usage } : {}
          }
        }));
      } catch (error) {
        handle_provider_error(
          error,
          this.name,
          "fetch search results"
        );
      }
    };
    return retry_with_backoff(search_request);
  }
};

// src/server/provider-definitions.ts
var make_processing_provider_key = (provider, mode) => `${provider}:${mode}`;
var web_search_provider_definitions = [
  {
    id: "tavily",
    name: "tavily",
    category: "search",
    api_key_name: "TAVILY_API_KEY",
    tools: ["web_search"],
    capabilities: [
      "web_search",
      "domain_filters",
      "operator_translation"
    ],
    api_key: config.search.tavily.api_key,
    create: () => new TavilySearchProvider()
  },
  {
    id: "brave",
    name: "brave",
    category: "search",
    api_key_name: "BRAVE_API_KEY",
    tools: ["web_search"],
    capabilities: [
      "web_search",
      "domain_filters",
      "operator_passthrough"
    ],
    api_key: config.search.brave.api_key,
    create: () => new BraveSearchProvider()
  },
  {
    id: "kagi",
    name: "kagi",
    category: "search",
    api_key_name: "KAGI_API_KEY",
    tools: ["web_search"],
    capabilities: [
      "web_search",
      "domain_filters",
      "operator_passthrough"
    ],
    api_key: config.search.kagi.api_key,
    create: () => new KagiSearchProvider()
  },
  {
    id: "exa",
    name: "exa",
    category: "search",
    api_key_name: "EXA_API_KEY",
    tools: ["web_search"],
    capabilities: ["web_search", "domain_filters", "semantic_search"],
    api_key: config.search.exa.api_key,
    create: () => new ExaSearchProvider()
  },
  {
    id: "firecrawl",
    name: "firecrawl",
    category: "search",
    api_key_name: "FIRECRAWL_API_KEY",
    tools: ["web_search"],
    capabilities: ["web_search", "domain_filters", "time_range"],
    api_key: config.search.firecrawl.api_key,
    create: () => new FirecrawlSearchProvider()
  },
  {
    id: "kagi_enrichment",
    name: "kagi_enrichment",
    category: "search",
    api_key_name: "KAGI_API_KEY",
    tools: ["web_search"],
    capabilities: ["specialized_indexes", "web_enrichment"],
    api_key: config.enhancement.kagi_enrichment.api_key,
    create: () => new KagiEnrichmentSearchProvider()
  }
];
var ai_search_provider_definitions = [
  {
    id: "kagi_fastgpt",
    name: "kagi_fastgpt",
    category: "ai_response",
    api_key_name: "KAGI_API_KEY",
    tools: ["ai_search"],
    capabilities: ["answer_generation", "citations"],
    api_key: config.ai_response.kagi_fastgpt.api_key,
    create: () => new KagiFastGPTProvider()
  },
  {
    id: "exa_answer",
    name: "exa_answer",
    category: "ai_response",
    api_key_name: "EXA_API_KEY",
    tools: ["ai_search"],
    capabilities: ["answer_generation", "semantic_search"],
    api_key: config.ai_response.exa_answer.api_key,
    create: () => new ExaAnswerProvider()
  },
  {
    id: "linkup",
    name: "linkup",
    category: "ai_response",
    api_key_name: "LINKUP_API_KEY",
    tools: ["ai_search"],
    capabilities: ["answer_generation", "citations"],
    api_key: config.ai_response.linkup.api_key,
    create: () => new LinkupProvider()
  },
  {
    id: "tavily_research",
    name: "tavily_research",
    category: "ai_response",
    api_key_name: "TAVILY_API_KEY",
    tools: ["ai_search"],
    capabilities: ["deep_research", "answer_generation", "citations"],
    api_key: config.ai_response.tavily_research.api_key,
    create: () => new TavilyResearchProvider()
  }
];
var github_provider_definitions = [
  {
    id: "github",
    name: "github",
    category: "search",
    api_key_name: "GITHUB_API_KEY",
    tools: ["github_search"],
    modes: ["code", "repositories", "users"],
    capabilities: ["code_search", "repository_search", "user_search"],
    api_key: config.search.github.api_key,
    create: () => new GitHubSearchProvider()
  }
];
var library_docs_provider_definitions = [
  {
    id: "context7",
    name: "context7",
    category: "search",
    api_key_name: "CONTEXT7_API_KEY",
    tools: ["library_docs"],
    capabilities: ["library_resolution", "library_docs"],
    api_key: config.docs.context7.api_key,
    create: () => new Context7Provider()
  }
];
var web_extract_provider_definitions = [
  {
    id: make_processing_provider_key("tavily", "extract"),
    name: "tavily",
    category: "processing",
    api_key: config.processing.tavily_extract.api_key,
    api_key_name: "TAVILY_API_KEY",
    tools: ["web_extract"],
    modes: ["extract"],
    capabilities: ["content_extraction", "raw_contents"],
    default_mode: true,
    create: () => new TavilyExtractProvider()
  },
  {
    id: make_processing_provider_key("tavily", "crawl"),
    name: "tavily",
    category: "processing",
    api_key: config.processing.tavily_crawl.api_key,
    api_key_name: "TAVILY_API_KEY",
    tools: ["web_extract"],
    modes: ["crawl"],
    capabilities: ["crawling", "content_extraction", "raw_contents"],
    create: () => new TavilyCrawlProvider()
  },
  {
    id: make_processing_provider_key("tavily", "map"),
    name: "tavily",
    category: "processing",
    api_key: config.processing.tavily_map.api_key,
    api_key_name: "TAVILY_API_KEY",
    tools: ["web_extract"],
    modes: ["map"],
    capabilities: ["site_mapping"],
    create: () => new TavilyMapProvider()
  },
  {
    id: make_processing_provider_key("kagi", "summarize"),
    name: "kagi",
    category: "processing",
    api_key: config.processing.kagi_summarizer.api_key,
    api_key_name: "KAGI_API_KEY",
    tools: ["web_extract"],
    modes: ["summarize"],
    capabilities: ["summarization"],
    default_mode: true,
    create: () => new KagiSummarizerProvider()
  },
  {
    id: make_processing_provider_key("firecrawl", "scrape"),
    name: "firecrawl",
    category: "processing",
    api_key: config.processing.firecrawl_scrape.api_key,
    api_key_name: "FIRECRAWL_API_KEY",
    tools: ["web_extract"],
    modes: ["scrape"],
    capabilities: ["scraping"],
    default_mode: true,
    create: () => new FirecrawlScrapeProvider()
  },
  {
    id: make_processing_provider_key("firecrawl", "crawl"),
    name: "firecrawl",
    category: "processing",
    api_key: config.processing.firecrawl_crawl.api_key,
    api_key_name: "FIRECRAWL_API_KEY",
    tools: ["web_extract"],
    modes: ["crawl"],
    capabilities: ["crawling"],
    create: () => new FirecrawlCrawlProvider()
  },
  {
    id: make_processing_provider_key("firecrawl", "map"),
    name: "firecrawl",
    category: "processing",
    api_key: config.processing.firecrawl_map.api_key,
    api_key_name: "FIRECRAWL_API_KEY",
    tools: ["web_extract"],
    modes: ["map"],
    capabilities: ["site_mapping"],
    create: () => new FirecrawlMapProvider()
  },
  {
    id: make_processing_provider_key("firecrawl", "extract"),
    name: "firecrawl",
    category: "processing",
    api_key: config.processing.firecrawl_extract.api_key,
    api_key_name: "FIRECRAWL_API_KEY",
    tools: ["web_extract"],
    modes: ["extract"],
    capabilities: ["structured_extraction"],
    create: () => new FirecrawlExtractProvider()
  },
  {
    id: make_processing_provider_key("firecrawl", "actions"),
    name: "firecrawl",
    category: "processing",
    api_key: config.processing.firecrawl_actions.api_key,
    api_key_name: "FIRECRAWL_API_KEY",
    tools: ["web_extract"],
    modes: ["actions"],
    capabilities: ["browser_actions"],
    create: () => new FirecrawlActionsProvider()
  },
  {
    id: make_processing_provider_key("exa", "contents"),
    name: "exa",
    category: "processing",
    api_key: config.processing.exa_contents.api_key,
    api_key_name: "EXA_API_KEY",
    tools: ["web_extract"],
    modes: ["contents"],
    capabilities: ["content_retrieval"],
    default_mode: true,
    create: () => new ExaContentsProvider()
  },
  {
    id: make_processing_provider_key("exa", "similar"),
    name: "exa",
    category: "processing",
    api_key: config.processing.exa_similar.api_key,
    api_key_name: "EXA_API_KEY",
    tools: ["web_extract"],
    modes: ["similar"],
    capabilities: ["similar_pages"],
    create: () => new ExaSimilarProvider()
  }
];
var get_default_web_extract_mode = (provider) => web_extract_provider_definitions.find(
  (definition) => definition.name === provider && definition.default_mode
)?.modes[0];
var get_valid_web_extract_modes = (provider) => web_extract_provider_definitions.filter((definition) => definition.name === provider).map((definition) => definition.modes[0]);

// src/server/provider-registry.ts
var ProviderRegistry = class {
  providers = /* @__PURE__ */ new Map();
  statuses = /* @__PURE__ */ new Map();
  missing_api_key_names = /* @__PURE__ */ new Set();
  clear() {
    this.providers.clear();
    this.statuses.clear();
    this.missing_api_key_names.clear();
  }
  register(definition) {
    const api_key_name = definition.api_key_name ?? definition.name;
    const base_status = {
      id: definition.id,
      name: definition.name,
      category: definition.category,
      api_key_name,
      description: definition.description,
      tools: definition.tools ?? [],
      modes: definition.modes ?? [],
      capabilities: definition.capabilities ?? []
    };
    if (!definition.api_key || definition.api_key.trim() === "") {
      if (!this.missing_api_key_names.has(api_key_name)) {
        is_api_key_valid(definition.api_key, api_key_name);
        this.missing_api_key_names.add(api_key_name);
      }
      this.statuses.set(definition.id, {
        ...base_status,
        status: "unavailable",
        unavailable_reason: "missing_api_key"
      });
      return;
    }
    if (!is_api_key_valid(definition.api_key, api_key_name)) {
      this.statuses.set(definition.id, {
        ...base_status,
        status: "unavailable",
        unavailable_reason: "missing_api_key"
      });
      return;
    }
    const instance = definition.create();
    this.providers.set(definition.id, {
      ...base_status,
      instance,
      description: definition.description ?? instance.description
    });
    this.statuses.set(definition.id, {
      ...base_status,
      status: "available",
      description: definition.description ?? instance.description
    });
  }
  register_all(definitions) {
    for (const definition of definitions) {
      this.register(definition);
    }
  }
  get(id) {
    return this.providers.get(id)?.instance;
  }
  require(id, tool_name, message = `Provider "${id}" is not available. Available: ${this.ids().join(", ")}`) {
    const provider = this.get(id);
    if (!provider) {
      throw new ProviderError(
        "INVALID_INPUT" /* INVALID_INPUT */,
        message,
        tool_name
      );
    }
    return provider;
  }
  ids() {
    return Array.from(this.providers.keys());
  }
  names() {
    return Array.from(
      new Set(
        Array.from(this.providers.values()).map(
          (provider) => provider.name
        )
      )
    );
  }
  entries() {
    return Array.from(this.providers.values());
  }
  status_entries() {
    return Array.from(this.statuses.values());
  }
  get size() {
    return this.providers.size;
  }
};

// src/server/tools/responses.ts
var create_json_tool_response = (payload) => ({
  content: [
    {
      type: "text",
      text: JSON.stringify(payload, null, 2)
    }
  ]
});
var create_error_tool_response = (error) => ({
  ...create_json_tool_response(create_error_response(error)),
  isError: true
});
var handle_tool_result = async (tool_name, result, options = {}) => {
  try {
    return create_json_tool_response(
      handle_large_result(await result(), tool_name, {
        mode: options.large_result_mode
      })
    );
  } catch (error) {
    return create_error_tool_response(error);
  }
};

// src/server/tools/schemas.ts
var DOMAIN_PATTERN = /^(?:\*\.)?(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
var query_schema = pipe(
  string(),
  minLength(1, "Query cannot be empty"),
  regex(/\S/, "Query cannot be empty"),
  description("Search query")
);
var limit_schema = optional(
  pipe(
    number(),
    integer("Limit must be an integer"),
    minValue(1, "Limit must be at least 1"),
    maxValue(50, "Limit must be at most 50"),
    description("Maximum number of results (default: 10)")
  )
);
var search_depth_schema = optional(
  pipe(
    picklist(["basic", "advanced", "fast", "ultra-fast"]),
    description(
      "Search depth. Providers may use this to balance speed, relevance, and cost."
    )
  )
);
var search_topic_schema = optional(
  pipe(
    picklist(["general", "news", "finance"]),
    description("Search topic category.")
  )
);
var search_time_range_schema = optional(
  pipe(
    picklist(["day", "week", "month", "year"]),
    description("Only return results from this recent time range.")
  )
);
var safe_search_schema = optional(
  pipe(
    boolean(),
    description("Enable provider safe-search filtering.")
  )
);
var auto_parameters_schema = optional(
  pipe(
    boolean(),
    description(
      "Let supported providers select search settings from the query. This can change cost."
    )
  )
);
var include_raw_content_schema = optional(
  pipe(
    boolean(),
    description(
      "Include full page content when the selected provider supports it."
    )
  )
);
var large_result_mode_schema = optional(
  pipe(
    picklist(["inline", "file"]),
    description(
      "How to handle oversized responses for this request. Use inline for remote/container transports; file is local shared-filesystem behavior. Defaults to OMNISEARCH_LARGE_RESULT_MODE or file."
    )
  )
);
var extraction_query_schema = optional(
  pipe(
    string(),
    minLength(1, "Extraction query cannot be empty"),
    regex(/\S/, "Extraction query cannot be empty"),
    description(
      "Focus extracted content on information relevant to this query."
    )
  )
);
var chunks_per_source_schema = optional(
  pipe(
    number(),
    integer("Chunks per source must be an integer"),
    minValue(1, "Chunks per source must be at least 1"),
    maxValue(5, "Chunks per source must be at most 5"),
    description(
      "Maximum relevant content chunks per source when a query is provided."
    )
  )
);
var extraction_format_schema = optional(
  pipe(
    picklist(["markdown", "text"]),
    description("Extracted page format (default: markdown).")
  )
);
var include_raw_contents_schema = optional(
  pipe(
    boolean(),
    description(
      "Whether extraction responses should include per-URL raw_contents alongside combined content (default: true)."
    )
  )
);
var domain_schema = pipe(
  string(),
  regex(DOMAIN_PATTERN, "Domain must be a hostname, not a URL")
);
var include_domains_schema = optional(
  pipe(
    array(domain_schema),
    maxLength(20, "Use at most 20 included domains"),
    description("Only return results from these domains")
  )
);
var exclude_domains_schema = optional(
  pipe(
    array(domain_schema),
    maxLength(20, "Use at most 20 excluded domains"),
    description("Exclude results from these domains")
  )
);
var http_url_schema = pipe(
  string(),
  url("URL must be valid"),
  regex(/^https?:\/\//, "URL protocol must be http or https")
);
var url_or_urls_schema = pipe(
  union([
    http_url_schema,
    pipe(
      array(http_url_schema),
      minLength(1, "Provide at least one URL"),
      maxLength(10, "Use at most 10 URLs per extraction")
    )
  ]),
  description("URL or array of URLs to process")
);

// src/server/tools/ai-search.ts
var providers = new ProviderRegistry();
var initialize_ai_search = () => {
  providers.clear();
  providers.register_all(ai_search_provider_definitions);
  return providers.size > 0;
};
var get_available_providers = () => providers.names();
var get_provider_status_entries = () => providers.status_entries();
var register_ai_search = (server2) => {
  if (providers.size === 0) return;
  const provider_names = providers.ids();
  server2.tool(
    {
      name: "ai_search",
      description: "Get AI-powered answers with citations and reasoning. Use when you need synthesized answers rather than raw search results. Providers: kagi_fastgpt (fast answers), exa_answer (semantic AI), linkup (deep agentic search), tavily_research (asynchronous multi-search reports; resubmit its research_id to retrieve results).",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      },
      schema: object({
        query: query_schema,
        provider: pipe(
          picklist(provider_names),
          description("AI search provider to use")
        ),
        limit: limit_schema,
        research_id: optional(
          pipe(
            string(),
            minLength(1),
            description(
              "Existing asynchronous research task ID to retrieve. Supported by Tavily Research."
            )
          )
        ),
        large_result_mode: large_result_mode_schema
      })
    },
    async ({
      query,
      provider,
      limit,
      research_id,
      large_result_mode
    }) => handle_tool_result(
      "ai_search",
      async () => {
        const selected = providers.require(provider, "ai_search");
        return selected.search({
          query,
          limit,
          research_id
        });
      },
      { large_result_mode }
    )
  );
};

// src/server/tools/github-search.ts
var providers2 = new ProviderRegistry();
var initialize_github_search = () => {
  providers2.clear();
  providers2.register_all(github_provider_definitions);
  return providers2.size > 0;
};
var get_available = () => providers2.names();
var get_provider_status_entries2 = () => providers2.status_entries();
var register_github_search = (server2) => {
  if (providers2.size === 0) return;
  server2.tool(
    {
      name: "github_search",
      description: "Search GitHub for code, repositories, or users. Use when you need to find code examples, open source projects, or developers. Supports advanced syntax: filename:, path:, repo:, user:, language:, in:file.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      },
      schema: object({
        query: query_schema,
        search_type: optional(
          pipe(
            picklist(["code", "repositories", "users"]),
            description("What to search for (default: code)")
          )
        ),
        limit: limit_schema,
        large_result_mode: large_result_mode_schema,
        sort: optional(
          pipe(
            picklist(["stars", "forks", "updated"]),
            description("Sort order (repositories only)")
          )
        )
      })
    },
    async ({
      query,
      search_type = "code",
      limit,
      large_result_mode,
      sort
    }) => handle_tool_result(
      "github_search",
      async () => {
        const selected = providers2.require(
          "github",
          "github_search"
        );
        switch (search_type) {
          case "code":
            return selected.search_code({
              query,
              limit
            });
          case "repositories":
            return selected.search_repositories({
              query,
              limit,
              sort
            });
          case "users":
            return selected.search_users({
              query,
              limit
            });
        }
      },
      { large_result_mode }
    )
  );
};

// src/server/tools/library-docs.ts
var providers3 = new ProviderRegistry();
var initialize_library_docs = () => {
  providers3.clear();
  providers3.register_all(library_docs_provider_definitions);
  return providers3.size > 0;
};
var get_available2 = () => providers3.names();
var get_provider_status_entries3 = () => providers3.status_entries();
var register_library_docs = (server2) => {
  if (providers3.size === 0) return;
  server2.tool(
    {
      name: "library_docs",
      description: 'Up-to-date documentation and code examples for a programming library, framework or SDK (Context7). Use before writing code against an API you are not sure of. Give the library name and what you want to know; the best-matching library is picked and its most relevant snippets returned, with other candidates listed. Pass library_id (e.g. "/vercel/next.js", or a version such as "/vercel/next.js/v15.1.8") from a previous answer to pin an exact library or version.',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      },
      schema: object({
        query: pipe(
          string(),
          minLength(1, "Query cannot be empty"),
          regex(/\S/, "Query cannot be empty"),
          description(
            'What you want to know, e.g. "useEffect cleanup" or "configure middleware"'
          )
        ),
        library: optional(
          pipe(
            string(),
            description(
              'Library name, e.g. "react", "next.js", "valibot" (when library_id is not given)'
            )
          )
        ),
        library_id: optional(
          pipe(
            string(),
            description(
              'Exact Context7 library id from a previous answer, e.g. "/vercel/next.js"'
            )
          )
        ),
        large_result_mode: large_result_mode_schema
      })
    },
    async ({ query, library, library_id, large_result_mode }) => handle_tool_result(
      "library_docs",
      async () => providers3.require("context7", "library_docs").get_docs({ query, library, library_id }),
      { large_result_mode }
    )
  );
};

// src/server/tools/web-extract.ts
var providers4 = new ProviderRegistry();
var initialize_web_extract = () => {
  providers4.clear();
  providers4.register_all(web_extract_provider_definitions);
  return providers4.size > 0;
};
var get_available_providers2 = () => providers4.names();
var get_provider_status_entries4 = () => providers4.status_entries();
var web_extract_modes = Array.from(
  new Set(
    web_extract_provider_definitions.map(
      (definition) => definition.modes[0]
    )
  )
);
var register_web_extract = (server2) => {
  if (providers4.size === 0) return;
  const available = get_available_providers2();
  server2.tool(
    {
      name: "web_extract",
      description: "Extract, process, or summarize web content from URLs. Use when you need to read page content, summarize articles, crawl sites, or extract structured data. Providers: tavily (content extraction), kagi (summarization of pages/videos/podcasts), firecrawl (scraping/crawling/mapping/structured extraction/interactive), exa (content retrieval/similar pages).",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      },
      schema: object({
        url: url_or_urls_schema,
        provider: pipe(
          picklist(available),
          description("Processing provider to use")
        ),
        mode: optional(
          pipe(
            picklist(web_extract_modes),
            description(
              "Processing mode. Firecrawl: scrape/crawl/map/extract/actions. Exa: contents/similar. Tavily: extract/crawl/map. Kagi: summarize. Defaults to provider default."
            )
          )
        ),
        extract_depth: optional(
          pipe(
            picklist(["basic", "advanced"]),
            description("Extraction depth (default: basic)")
          )
        ),
        query: extraction_query_schema,
        chunks_per_source: chunks_per_source_schema,
        format: extraction_format_schema,
        large_result_mode: large_result_mode_schema,
        include_raw_contents: include_raw_contents_schema
      })
    },
    async ({
      url: url2,
      provider,
      mode,
      extract_depth,
      query,
      chunks_per_source,
      format,
      large_result_mode,
      include_raw_contents = true
    }) => handle_tool_result(
      "web_extract",
      async () => {
        if (chunks_per_source !== void 0 && !query) {
          throw new ProviderError(
            "INVALID_INPUT" /* INVALID_INPUT */,
            "query is required when chunks_per_source is provided",
            "web_extract"
          );
        }
        const provider_name = provider;
        const resolved_mode = mode || get_default_web_extract_mode(provider_name);
        const allowed = get_valid_web_extract_modes(provider_name);
        if (!resolved_mode || !allowed.includes(resolved_mode)) {
          throw new ProviderError(
            "INVALID_INPUT" /* INVALID_INPUT */,
            `Mode "${resolved_mode}" is not valid for provider "${provider}". Valid modes: ${allowed.join(", ")}`,
            "web_extract"
          );
        }
        const key = make_processing_provider_key(
          provider,
          resolved_mode
        );
        const selected = providers4.require(
          key,
          "web_extract",
          `Provider "${provider}" with mode "${resolved_mode}" is not available. Available modes for configured providers: ${allowed.join(", ") || "none"}.`
        );
        const result = await selected.process_content(
          url2,
          extract_depth,
          { query, chunks_per_source, format }
        );
        return include_raw_contents ? result : omit_raw_contents(result);
      },
      { large_result_mode }
    )
  );
};

// src/server/tools/web-search.ts
var providers5 = new ProviderRegistry();
var initialize_web_search = () => {
  providers5.clear();
  providers5.register_all(web_search_provider_definitions);
  return providers5.size > 0;
};
var get_available_providers3 = () => providers5.names();
var get_provider_status_entries5 = () => providers5.status_entries();
var register_web_search = (server2) => {
  if (providers5.size === 0) return;
  const provider_names = providers5.ids();
  server2.tool(
    {
      name: "web_search",
      description: "Search the web for information. Use when you need to find web pages, articles, or data. Providers: tavily (factual/citations and search controls), brave (privacy/operators), kagi (quality/operators), exa (AI-semantic), firecrawl (Google-like results; read pages with web_extract firecrawl), kagi_enrichment (specialized indexes). Search depth, topic, time range, safe search, raw content, and automatic parameters apply when supported by the provider.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      },
      schema: object({
        query: query_schema,
        provider: pipe(
          picklist(provider_names),
          description("Search provider to use")
        ),
        limit: limit_schema,
        include_domains: include_domains_schema,
        exclude_domains: exclude_domains_schema,
        search_depth: search_depth_schema,
        topic: search_topic_schema,
        time_range: search_time_range_schema,
        safe_search: safe_search_schema,
        include_raw_content: include_raw_content_schema,
        auto_parameters: auto_parameters_schema,
        large_result_mode: large_result_mode_schema
      })
    },
    async ({
      query,
      provider,
      limit,
      include_domains,
      exclude_domains,
      search_depth,
      topic,
      time_range,
      safe_search,
      include_raw_content,
      auto_parameters,
      large_result_mode
    }) => handle_tool_result(
      "web_search",
      async () => {
        const selected = providers5.require(provider, "web_search");
        return selected.search({
          query,
          limit,
          include_domains,
          exclude_domains,
          search_depth,
          topic,
          time_range,
          safe_search,
          include_raw_content,
          auto_parameters
        });
      },
      { large_result_mode }
    )
  );
};

// src/server/tools/index.ts
var available_providers = {
  search: /* @__PURE__ */ new Set(),
  ai_response: /* @__PURE__ */ new Set(),
  processing: /* @__PURE__ */ new Set()
};
var provider_status_entries = [];
var reset_provider_tracking = () => {
  available_providers.search.clear();
  available_providers.ai_response.clear();
  available_providers.processing.clear();
  provider_status_entries.length = 0;
};
var initialize_providers = () => {
  reset_provider_tracking();
  if (initialize_web_search()) {
    for (const p of get_available_providers3())
      available_providers.search.add(p);
  }
  provider_status_entries.push(
    ...get_provider_status_entries5()
  );
  if (initialize_github_search()) {
    for (const p of get_available())
      available_providers.search.add(p);
  }
  provider_status_entries.push(
    ...get_provider_status_entries2()
  );
  if (initialize_library_docs()) {
    for (const p of get_available2())
      available_providers.search.add(p);
  }
  provider_status_entries.push(...get_provider_status_entries3());
  if (initialize_ai_search()) {
    for (const p of get_available_providers())
      available_providers.ai_response.add(p);
  }
  provider_status_entries.push(...get_provider_status_entries());
  if (initialize_web_extract()) {
    for (const p of get_available_providers2())
      available_providers.processing.add(p);
  }
  provider_status_entries.push(
    ...get_provider_status_entries4()
  );
  console.error("Available providers:");
  if (available_providers.search.size > 0) {
    console.error(
      `- Search: ${Array.from(available_providers.search).join(", ")}`
    );
  } else {
    console.error("- Search: None available (missing API keys)");
  }
  if (available_providers.ai_response.size > 0) {
    console.error(
      `- AI Response: ${Array.from(available_providers.ai_response).join(", ")}`
    );
  } else {
    console.error("- AI Response: None available (missing API keys)");
  }
  if (available_providers.processing.size > 0) {
    console.error(
      `- Processing: ${Array.from(available_providers.processing).join(", ")}`
    );
  } else {
    console.error("- Processing: None available (missing API keys)");
  }
};
var register_tools = (server2) => {
  register_web_search(server2);
  register_github_search(server2);
  register_library_docs(server2);
  register_ai_search(server2);
  register_web_extract(server2);
};

// src/server/handlers.ts
var categories = [
  "search",
  "ai_response",
  "processing"
];
var unique = (values) => Array.from(new Set(values)).sort();
var grouped_provider_status = () => {
  const grouped = {
    search: [],
    ai_response: [],
    processing: []
  };
  for (const provider of provider_status_entries) {
    grouped[provider.category].push(provider);
  }
  return grouped;
};
var aggregate_provider_info = (provider_name, category) => {
  const entries = provider_status_entries.filter(
    (provider) => (provider.id === provider_name || provider.name === provider_name) && (!category || provider.category === category)
  );
  if (entries.length === 0) return void 0;
  const status = entries.some(
    (provider) => provider.status === "available"
  ) ? "available" : "unavailable";
  return {
    name: provider_name,
    status,
    categories: unique(entries.map((provider) => provider.category)),
    tools: unique(entries.flatMap((provider) => provider.tools)),
    modes: unique(entries.flatMap((provider) => provider.modes)),
    capabilities: unique(
      entries.flatMap((provider) => provider.capabilities)
    ),
    providers: entries.map((provider) => ({
      id: provider.id,
      name: provider.name,
      category: provider.category,
      status: provider.status,
      api_key_name: provider.api_key_name,
      description: provider.description,
      tools: provider.tools,
      modes: provider.modes,
      capabilities: provider.capabilities,
      unavailable_reason: provider.unavailable_reason
    }))
  };
};
var setup_handlers = (server2) => {
  server2.resource(
    {
      name: "provider-status",
      description: "Current status of all configured providers",
      uri: "omnisearch://providers/status"
    },
    async () => {
      const providers6 = grouped_provider_status();
      const available_count = Object.fromEntries(
        categories.map((category) => [
          category,
          providers6[category].filter(
            (provider) => provider.status === "available"
          ).length
        ])
      );
      const unavailable_count = Object.fromEntries(
        categories.map((category) => [
          category,
          providers6[category].filter(
            (provider) => provider.status === "unavailable"
          ).length
        ])
      );
      const total = provider_status_entries.length;
      const available_total = categories.reduce(
        (sum, category) => sum + available_count[category],
        0
      );
      return {
        contents: [
          {
            uri: "omnisearch://providers/status",
            mimeType: "application/json",
            text: JSON.stringify(
              {
                status: available_total === 0 ? "unavailable" : available_total === total ? "operational" : "degraded",
                providers: providers6,
                available_count: {
                  ...available_count,
                  total: available_total
                },
                unavailable_count: {
                  ...unavailable_count,
                  total: total - available_total
                }
              },
              null,
              2
            )
          }
        ]
      };
    }
  );
  server2.resource(
    {
      name: "provider-info",
      description: "Information about a specific configured provider",
      uri: "omnisearch://providers/{provider}/info"
    },
    async (uri) => {
      const providerMatch = uri.match(
        /^omnisearch:\/\/(providers|search|ai_response|processing)\/([^/]+)\/info$/
      );
      if (providerMatch) {
        const [, scope, providerName] = providerMatch;
        const category = scope === "providers" ? void 0 : scope;
        const providerInfo = aggregate_provider_info(
          providerName,
          category
        );
        if (!providerInfo) {
          throw new Error(`Unknown provider: ${providerName}`);
        }
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(providerInfo, null, 2)
            }
          ]
        };
      }
      throw new Error(`Unknown resource URI: ${uri}`);
    }
  );
};

// src/mcp-server.ts
function create_mcp_server(metadata) {
  const server2 = new McpServer(metadata, {
    adapter: new ValibotJsonSchemaAdapter(),
    capabilities: {
      tools: { listChanged: true },
      resources: { listChanged: true }
    }
  });
  initialize_providers();
  register_tools(server2);
  setup_handlers(server2);
  return server2;
}

// src/index.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var pkg = JSON.parse(
  readFileSync(join2(__dirname, "..", "package.json"), "utf8")
);
var { name, version } = pkg;
validate_config();
var server = create_mcp_server({
  name,
  version,
  description: "MCP server for integrating Omnisearch with LLMs"
});
process.on("SIGINT", () => {
  process.exit(0);
});
new StdioTransport(server).listen();
console.error("Omnisearch MCP server running on stdio");
/*! Bundled license information:

@octokit/request-error/dist-src/index.js:
  (* v8 ignore else -- @preserve -- Bug with vitest coverage where it sees an else branch that doesn't exist *)

@octokit/request/dist-bundle/index.js:
  (* v8 ignore next -- @preserve *)
  (* v8 ignore else -- @preserve *)

toad-cache/dist/toad-cache.mjs:
  (**
   * toad-cache
   *
   * @copyright 2024 Igor Savin <kibertoad@gmail.com>
   * @license MIT
   * @version 3.7.0
   *)

octokit/dist-bundle/index.js:
  (* v8 ignore next no need to test internals of the throttle plugin -- @preserve *)
*/
