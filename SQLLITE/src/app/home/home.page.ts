import { Component } from '@angular/core';
import { SqliteService } from '../servicios/sqlite.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  public usuario : string;
  public usuarios : string[];

  constructor(private sqlite : SqliteService) {
    this.usuario = "";
    this.usuarios = [];
  }

  ionViewWillEnter(){
    this.read();
  }

  create(){
    this.sqlite.create(this.usuario.toUpperCase()).then((changes) => {
      console.log(changes);
      console.log("Usuario creado");
      this.read();
    }).catch((error) => {
      console.error(error);
      console.log("Error al crear usuario");
    });

  }

  read(){
    this.sqlite.read().then((usuarios:string[]) => {
      this.usuarios = usuarios;
      console.log("Usuarios leidos");
      console.log(this.usuarios);
    }).catch((error) => {
      console.error(error);
      console.log("Error al leer usuarios");
    });
  }

  update(usuario : string){
    this.sqlite.update(this.usuario.toUpperCase(),usuario).then((changes) => {
      console.log(changes);
      console.log("Usuario actualizado");
      this.read();
    }).catch((error) => {
      console.error(error);
      console.log("Error al actualizar usuario");
    });
  }

  delete(usuario : string){
    this.sqlite.delete(usuario).then((changes) => {
      console.log(changes);
      console.log("Usuario eliminado");
      this.read();
    }).catch((error) => {
      console.error(error);
      console.log("Error al eliminar usuario");
    });
  }

}
