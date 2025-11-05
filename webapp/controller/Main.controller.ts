import { FilterBar$ClearEvent, FilterBar$SearchEvent } from "sap/ui/comp/filterbar/FilterBar";
import BaseController from "./BaseController";
import Control from "sap/ui/core/Control";
import Input from "sap/m/Input";
import ComboBox from "sap/m/ComboBox";
import MultiComboBox from "sap/m/MultiComboBox";
import Filter from "sap/ui/model/Filter";
import Table from "sap/m/Table";
import FilterOperator from "sap/ui/model/FilterOperator";
import ListBinding from "sap/ui/model/ListBinding";
import Event from "sap/ui/base/Event";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import UIComponent from "sap/ui/core/UIComponent";
import ReimportsourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import { ODataListBinding$ChangeEvent } from "sap/ui/model/odata/v4/ODataListBinding";
import Title from "sap/m/Title";
import JSONModel from "sap/ui/model/json/JSONModel";
import SelectDialog, { SelectDialog$SearchEvent } from "sap/m/SelectDialog";
import Dialog from "sap/m/Dialog";
import Fragment from "sap/ui/core/Fragment";
import MultiInput from "sap/m/MultiInput";
import Token from "sap/m/Token";

/**
 * @namespace com.logaligroup.employees.controller
 */
export default class Main extends BaseController {
    private _countriesDialog?: Promise<SelectDialog>;
    private _sBaseTitle: string = "";
    private _iTotalRecords: number = 0;
    
    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {
        
        const oTable = this.byId("table") as Table;
        oTable.attachUpdateFinished(this.onUpdateFinished, this);
        //Guardar el título base
        const oTitle = this.byId("titletable") as Title;
        if (oTitle) {
           
            let resourceModel=(this.getOwnerComponent() as UIComponent).getModel("i18n") as ResourceModel;
            let sTitle= (resourceModel.getResourceBundle() as ResourceBundle).getText("title") as string;
            this._sBaseTitle = sTitle;
        }

        
        
            
           
        
    }
    
    private onUpdateFinished (oEvent:Event): void {
        const oTable = oEvent.getSource()  as Table;
        const iFilteredCount = (oEvent.getParameter("total") as number) ?? 0;
        const oTitle = this.byId("titletable") as Title;

        // Si es la primera vez, guardamos el total global
        if (this._iTotalRecords === 0 && iFilteredCount > 0) {
            this._iTotalRecords = iFilteredCount;
        }
        const iTotal = this._iTotalRecords || iFilteredCount;
        const sTitle = `${this._sBaseTitle} [${iFilteredCount}/${iTotal}]`;

        oTitle.setText(sTitle);

    }

    public onFilterSearchPress (event: FilterBar$SearchEvent): void {
        const aControls = event.getParameter("selectionSet") as Control[];
        const oInput = aControls.find(c => c instanceof Input) as Input;
        //const oMultiCombo = aControls.find(c => c instanceof MultiComboBox) as MultiComboBox;
        const oMultiInput = aControls.find(c => c instanceof MultiInput) as MultiInput;

        const sEmployee = oInput?.getValue()?.trim() ?? "";
        
        //const aSelectedCountries = oMultiCombo?.getSelectedKeys() ?? [];
        const aSelectedCountries =  (oMultiInput?.getTokens() || []).map(t => t.getText()).filter(Boolean);

        const filters: Filter[] = [];
       
        if (sEmployee) {
            filters.push(
                new Filter({
                    filters: [
                        new Filter("EmployeeID", "EQ", sEmployee),
                        new Filter({
                            filters:[
                                new Filter("FirstName", "Contains", sEmployee),
                                new Filter("LastName", "Contains", sEmployee)
                            ],
                            and: false
                        })
                    ],
                    and: false
                })      
            );        
        }
        // Filtro por países seleccionados en el MultiComboBox
        if (aSelectedCountries.length > 0) {
            const aCountryFilters = aSelectedCountries.map(
                (code) => new Filter("Country", FilterOperator.EQ, code)
            );
            filters.push(new Filter({ filters: aCountryFilters, and: false }));
        }
       

        const table = this.byId("table") as Table;
        const binding = table.getBinding("items") as ListBinding;
        binding.filter(filters);
    }
    

    public onClearPress(event: FilterBar$ClearEvent) : void{
        const aControls = event.getParameter("selectionSet") as Control[];
        const oInput = aControls.find(c => c instanceof Input) as Input;
        //const oMultiCombo = aControls.find(c => c instanceof MultiComboBox) as MultiComboBox;
        const oMultiInput = aControls.find(c => c instanceof MultiInput) as MultiInput;
        // Limpiar valores de los filtros
        if (oInput) {
            oInput.setValue("");
        }
        //if (oMultiCombo) {
        //    oMultiCombo.removeAllSelectedItems(); // Limpia todas las selecciones
        //    // o alternativamente:
        //    // oMultiCombo.setSelectedKeys([]);
        //} 
        if (oMultiInput) {
            oMultiInput.removeAllTokens(); // Limpia todas las selecciones
            // o alternativamente:
            // oMultiCombo.setSelectedKeys([]);
        } 

        this.onFilterSearchPress(event);
        //Forzar actualización del título
        const iTotal = this._iTotalRecords;
        const oTitle = this.byId("titletable") as Title;
        const sTitle = `${this._sBaseTitle} [${iTotal}/${iTotal}]`;
        oTitle.setText(sTitle);
    }
    //función que carga dinámicamente la librería xlsx
    //sólo si no está ya disponible
    private async loadXLSXLibrary(): Promise<void> {

        return new Promise((resolve, reject) => {
            // Si ya está cargada, no hace falta cargarla otra vez
            if ((window as any).XLSX) {
                resolve();
                return;
            }
            //resuelve la url real del recurso dentro de la aplicación sapui5
            //toUrl convierte el nómbre del módulo a una url válida
            const sUrl = sap.ui.require.toUrl("com/logaligroup/employees/lib/xlsx.full.min.js");
            //Luego crea la etiqueta <script> y la inyecta en el documento
            const script = document.createElement("script");
            script.src = sUrl;
            script.type = "text/javascript";
            //Cuando carga correctamente hace resolve() de la promise y deja XLSX disponible en window.
            script.onload = () => resolve();
            //Si falla la descarga, hace reject(e) con el error
            script.onerror = (e) => reject(e);
            document.head.appendChild(script);
        });
}
    //función para transformar lo que tenemos en una tabla, tal y como se ve, 
    // con filtros aplicados, a un fichero Excel y descargarlo
     public async  onExportToExcel(): Promise<void> {
             //0.Cargar la librería sólo si no está cargada aún
            await this.loadXLSXLibrary();
            const XLSX = (window as any).XLSX;

             // 1. Obtener la referencia a la tabla
             const oTable = this.byId("table") as Table;

             // 2. Obtener los objetos de datos puros de los contextos
             // 2. Obtener el binding de los items
             // Esto es crucial porque nos da los datos YA FILTRADOS por el FilterBar 
             //getItems devuelve las filas(items) instanciadas en la tabla
             const aTableData= oTable.getItems().map(item => {
                //da el contexto del modelo a cada fila
                const ctx = item.getBindingContext("employees");
                //devuelve el objeto javascript puro que alimenta esa fila
                return ctx ? ctx.getObject() : {};
             });
             //el resultado es aTableData que es un array de objetos con los datos
             //ya filtrados 

             // 3. Crear la Hoja de Cálculo (WorkSheet)
            // Usamos 'json_to_sheet' que toma un array de objetos
            const ws  = XLSX.utils.json_to_sheet(aTableData);

             // 6. Crear el Libro de Trabajo (WorkBook)
             const wb = XLSX.utils.book_new();

             // 7. Añadir la hoja al libro con un nombre (ej: "Empleados")
             XLSX.utils.book_append_sheet(wb, ws, "Empleados");

             
            // 8. Generar el archivo y lanza la descarga del archivo en el navegador del usuario
             XLSX.writeFile(wb, "ListaEmpleados.xlsx");
     }
     public formatCountryItemText(country: string, code: string): string {
        return `${country} (${code})`;
    }

    
    public handleValueHelp(oEvent: Event): void {
        const sInputValue: string =
            (oEvent.getSource() as any)?.getValue?.() ?? ""; // MultiInput.getValue()

        const oView = this.getView();

        if (!this._countriesDialog) {
        this._countriesDialog = (Fragment.load({
            id: oView.getId(),
            name: "com.logaligroup.employees.view.Countries",
            controller: this
        }) as Promise<SelectDialog>).then((oValueHelpDialog) => {
            oView.addDependent(oValueHelpDialog);
            return oValueHelpDialog;
        });
        }

        this._countriesDialog.then((oValueHelpDialog) => {
        // filtra los items del diálogo por el valor actual del input
        (oValueHelpDialog.getBinding("items") as ListBinding | null)?.filter([
            new Filter("country", FilterOperator.Contains, sInputValue)
        ]);
        oValueHelpDialog.open(sInputValue);
        });
  }

  /** Búsqueda dentro del SelectDialog */
    public _handleValueHelpSearch(oEvent: Event): void {
        const sValue: string = (oEvent.getParameter("value") as string) || "";
        const oDlg = oEvent.getSource() as SelectDialog;

        (oDlg.getBinding("items") as ListBinding | null)?.filter([
        new Filter({
            filters: [
                new Filter("country", FilterOperator.Contains, sValue),
                new Filter("code", FilterOperator.Contains, sValue)
            ],
            and: false
        })
        ]);
    }

    /** Cierre del diálogo: añade tokens al MultiInput */
    public _handleValueHelpClose(oEvent: Event): void {
        const aSelectedItems = (oEvent.getParameter("selectedItems") as any[]) || [];
        const oMultiInput = this.byId("idMultiInput") as MultiInput;
        if (!oMultiInput || aSelectedItems.length === 0) return;
        const existing = new Set(oMultiInput.getTokens().map(t => t.getText()));
        
        aSelectedItems.forEach((oItem: any) => {
            const code = oItem.getTitle();
            if (!existing.has(code)) {
                oMultiInput.addToken(new Token({ text: code}))
            }    
        });
        
    }

}