import { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";
import BaseController from "./BaseController";
import Adapter from "sap/ui/vbm/Adapter";
import View from "sap/ui/vk/View";

/**
 * @namespace com.logaligroup.employees.controller
 */
export default class Details extends BaseController {

    public onInit(): void | undefined {
        const router = this.getRouter();
        router.getRoute("RouteDetails")?.attachPatternMatched(this.onBindElement.bind(this));
    }

    // con este método accedemos a la url y obtenemos el id del empleado
    private onBindElement(event : Route$PatternMatchedEvent ) : void {
        let arg = event.getParameter("arguments") as any;
        let index = arg.ID;
        const view = this.getView() as View;
        view.bindElement({
            path: '/Employees/'+index,
            model: 'employees',
            //podemos detectar eventos
            events: {
                //evento cuendo hay un cambio
                change: () =>{

                },
                // Cuando se envía la solicitud
                dataRequested: () =>{
                    view.setBusy(true)
                },
                //Cuando se recibe la solicitud
                dataReceived: () => {
                    view.setBusy(false)
                }
            }
        })
    }

    public onClosePress () : void {
        const router = this.getRouter();
        router.navTo("RouteMaster");
        const model = this.getModel("view") as JSONModel;
        model.setProperty("/layout", "OneColumn");

    }
}