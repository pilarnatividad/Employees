import Controller from "sap/ui/core/mvc/Controller";
import Router from "sap/ui/core/routing/Router";
import Component from "../Component";
import Model from "sap/ui/model/Model";
import View from "sap/ui/core/mvc/View";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import History from "sap/ui/core/routing/History";
import EventBus from "sap/ui/core/EventBus";

/**
 * @namespace com.logaligroup.employees.controller
 */
export default class BaseController extends Controller {

    //para acceder al enrutador global de nuestra aplic sapui5
    public getRouter () : Router {
        return (this.getOwnerComponent() as Component).getRouter();
    }

    //devuelve el modelo asociado a la vista del controlador actual
    public getModel (name? : string): Model {
        return this.getView()?.getModel(name) as Model;
    }

    // asignar (o registrar) un modelo a la vista actual.
    // model puede ser pe. JSONModel, ODataModel
    public setModel(model : Model, name?: string) : View | undefined {
        return this.getView()?.setModel(model, name);
    }

    // acceder a los textos traducibles de la aplicación SAPUI5.
    public getResourceBundle() : ResourceBundle {
        let model = this.getOwnerComponent()?.getModel("i18n") as ResourceModel;
        return model.getResourceBundle() as ResourceBundle;
    }

    public onNavToBack() : void {
        let sPreviousHash = History.getInstance().getPreviousHash();
        if (sPreviousHash !== undefined){
            history.go(-1);
        }else {
            this.getRouter().navTo("RouteMain")
        }
    }

    public getEventBus () : EventBus {
        return this.getEventBus() as EventBus;
    }

     
}