import { LabboxExtensionContext } from '../pluginInterface'

const registerExtensions = async (context: LabboxExtensionContext) => {
  ;(await import('./correlograms/correlograms')).activate(context)
  ;(await import('./unitstable/unitstable')).activate(context)
  ;(await import('./mountainview/mountainview')).activate(context)
  ;(await import('./electrodegeometry/electrodegeometry')).activate(context)
  ;(await import('./averagewaveforms/averagewaveforms')).activate(context)
  ;(await import('./timeseries/timeseries')).activate(context)
  ;(await import('./clusters/clusters')).activate(context)
}

export default registerExtensions