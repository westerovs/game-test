export default class Utils {
  static abstractMethod(methodName = 'Method') {
    throw new Error(`${methodName} must be implemented`)
  }
}
