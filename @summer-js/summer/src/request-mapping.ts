import { pathToRegexp } from 'path-to-regexp'
import { Logger } from './logger'

export const requestMapping = {}
export const requestMappingAssembler = {
  params: [],
  controllerMethodDescriptors: [],
  controllerRequestMapping: {},
  nextController() {
    this.controllerMethodDescriptors = []
  },
  addParam(paramMethod: (ctx: any) => any, paramValues: any[], type: any, declareType: any, index: number) {
    this.params[index] = {
      paramValues,
      paramMethod,
      type,
      declareType,
      index
    }
  },
  addMethodRoute(path: string, httpMethod: string, callMethod: string, controllerName: string) {
    this.controllerRequestMapping[path] = {
      ...this.controllerRequestMapping[path],
      [httpMethod]: {
        callMethod,
        params: this.params,
        controllerName
      }
    }
    this.params = []
  },
  addMethodDescriptor(descriptor: PropertyDescriptor) {
    this.controllerMethodDescriptors.push(descriptor)
  },
  addControllerRoute(controllerName: string, controllerPath: string) {
    Object.keys(this.controllerRequestMapping).forEach((path) => {
      const keys = []
      const fullPath = controllerPath + path
      const regexp = pathToRegexp(fullPath, keys)

      let pathMappingData = requestMapping[fullPath] || {}
      ;['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'REQUEST'].forEach((reqMethod) => {
        if (pathMappingData[reqMethod] && this.controllerRequestMapping[path][reqMethod]) {
          Logger.error(
            `Duplicate request routes: ${reqMethod} ${fullPath || '/'} in ${JSON.stringify([
              pathMappingData[reqMethod].controllerName,
              controllerName
            ])}`
          )
          process.exit()
        }
      })

      requestMapping[fullPath] = {
        ...pathMappingData,
        ...this.controllerRequestMapping[path],
        pathRegExp: regexp,
        pathKeys: keys.map((key) => key.name)
      }
    })
    this.controllerRequestMapping = {}
  }
}
