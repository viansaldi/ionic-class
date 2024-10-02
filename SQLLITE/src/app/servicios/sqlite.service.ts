import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CapacitorSQLite, JsonSQLite, capSQLiteChanges, capSQLiteValues } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SqliteService {

  public dbReady: BehaviorSubject<boolean>
  public isWeb: boolean;
  public isIos: boolean;
  public dbName: string;

  constructor( private http : HttpClient) {
    this.dbReady = new BehaviorSubject(false);
    this.isWeb = false;
    this.isIos = false;
    this.dbName = '';
   }

   async init(){
    const info = await Device.getInfo();
    const sqlite = CapacitorSQLite as any;

    if(info.platform == 'android'){
      try{
        await sqlite.requestPermissions();
      }catch(error){
        console.error("Esta app necesita permisos para funcionar");
      }
    }else if(info.platform == 'web'){
      this.isWeb = true;
      await sqlite.initWebStore();
    }else if(info.platform == 'ios'){
      this.isIos = true;
    }

    this.setupDatabase();
  }

  async setupDatabase(){
    const dbSetup = await Preferences.get({ key:'first_setup_key'});

    if(!dbSetup.value){
      this.downloadDatabase();
    }else{
      this.dbName = await this.getDbName();
      await CapacitorSQLite.createConnection({ database:this.dbName});
      await CapacitorSQLite.open({ database: this.dbName});
      this.dbReady.next(true);
    }
  }

  async downloadDatabase(){
    this.http.get('assets/db/db.json').subscribe(async (jsonExport : JsonSQLite) => {
      const jsonstring = JSON.stringify(jsonExport);
      const isValid = await CapacitorSQLite.isJsonValid({jsonstring});
       
      if(isValid.result){
        this.dbName = jsonExport.database;
        await CapacitorSQLite.importFromJson({jsonstring});
        await CapacitorSQLite.createConnection({ database:this.dbName});
        await CapacitorSQLite.open({ database: this.dbName});

        await Preferences.set({ key: 'firs_setup_key',value:'1'});
        await Preferences.set({ key: 'dbname', value: this.dbName});

        this.dbReady.next(true);
      }
    });
  }

  async getDbName(){
    if(!this.dbName){
      const dbname = await Preferences.get({key : 'dbname'});
      if(dbname.value){
        this.dbName = dbname.value;
      }
    }
    return this.dbName;
  }

  async create(usuario : string){
    let sql = 'INSERT INTO usuarios VALUES(?)';
    const dbName = await this.getDbName();
    return CapacitorSQLite.executeSet({
      database: dbName,
      set: [
        {
          statement: sql,
          values: [
            usuario
          ]  
        }
      ]
    }).then( (changes : capSQLiteChanges) => {
      if(this.isWeb){
        CapacitorSQLite.saveToStore({ database : dbName});
      }
      return changes;

    }).catch(err => Promise.reject(err));
  }

  async read(){
    let sql = "SELECT * FROM usuarios";
    const dbName = await this.getDbName();
    return CapacitorSQLite.query({
      database: dbName,
      statement: sql,
      values: []
    }).then( (response : capSQLiteValues) => {
      let usuarios: string[] = [];
      if(this.isIos && response.values.length > 0){
        response.values.shift();
      }

      for(let index = 0; index < response.values.length;index++){
        const usuario = response.values[index];
        usuarios.push(usuario.name);
      }
      return usuarios;
    }).catch(err => Promise.reject(err))
  }

  async update(newUsuario: string, oldUsuario: string){
    let sql = 'UPDATE usuarios SET name = ? WHERE name = ?';
    const dbName = await this.getDbName();
    return CapacitorSQLite.executeSet({
      database: dbName,
      set: [
        {
          statement: sql,
          values: [
            newUsuario,
            oldUsuario
          ]
        }
      ]
    }).then( (changes : capSQLiteChanges) => {
      if(this.isWeb){
        CapacitorSQLite.saveToStore({ database: dbName});
      }
      return changes;
    }).catch(err => Promise.reject(err));

  }

  async delete(usuario : string){
    let sql = 'DELETE FROM usuarios WHERE name = ?';
    const dbName = await this.getDbName();
    return CapacitorSQLite.executeSet({
      database: dbName,
      set: [
        {
          statement: sql,
          values: [
            usuario
          ]
        }
      ] 
    }).then( (changes : capSQLiteChanges) => {
      if(this.isWeb){
        CapacitorSQLite.saveToStore({ database: dbName});
      }
      return changes;
    }).catch(err => Promise.reject(err));
  }
}
