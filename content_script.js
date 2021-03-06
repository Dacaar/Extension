'use strict';

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
  chrome.storage.local.getBytesInUse([msg.formulario], function(bytes){
    let instancia = msg.id;
    if (bytes > 0){ //entonces obtén el form del almacen local
      let parser = new DOMParser();
      let fichero_configurado;
      let fichero_parseado;
      //Obtiene el form del storage, lo guarda y lo parsea. Tras esto, ejecuta el autorrellenado.
      chrome.storage.local.get("Contacto", function(respuesta){
        fichero_configurado = respuesta.Contacto;
        fichero_parseado = parser.parseFromString(fichero_configurado,"text/xml");
        ejecutarAutorrellenado (fichero_parseado, instancia);
      });
    } else {
      getFormularioElegido(msg.formulario).then(function(fichero_xml){  //si no, pidelo al servidor
        ejecutarAutorrellenado(fichero_xml, instancia);
      });
    }
  });
})

function ejecutarAutorrellenado(xml, indice){
    let tablas = xml.getElementsByTagName("tabla"); //Esto recibe todos los nodos tabla (una colección).
    let objeto_parseado;
    
    for (var i = 0; i < tablas.length; i++){  //Recorre las tablas de la BBDD que se usaran en el form.
      //Obtiene el valor del atributo "valor" de la tabla cuyo índice es i.
      let nombre = tablas[i].attributes.getNamedItem("valor").value;
  
      //Obtenemos un objeto de la tabla del servidor, con índice arbitrario (Dado por mí).

      let campos = tablas[i].getElementsByTagName("campo");
      getElemento(nombre, indice).then(function(objeto){
        objeto_parseado = JSON.parse(objeto);

        //Obtenemos todos los campos asociados a la tabla i.
        //let campos = tablas[i].getElementsByTagName("campo");
        for (var j = 0; j < campos.length; j++){//Por cada tabla, recorre los campos que se rellenan con sus atributos.
          let id_campo;
          let tipo;
          let html_campo;
          let valor;
          //Obtengo el id del campo j a través del valor de su atributo llamado "id".
          id_campo = campos[j].attributes.getNamedItem("id").value;
    
          /*obtendremos ahora el valor del texto que irá en el form. Seleccionamos el tag atributo del campo j
          (sólo hay uno en el fichero XML) y el valor de su atributo llamado "valor".*/
          html_campo = document.getElementById(id_campo);

          valor = campos[j].getElementsByTagName("atributo")[0].childNodes[0].nodeValue;
          tipo = campos[j].getElementsByTagName("tipo")[0].childNodes[0].nodeValue;

          if (tipo == "check"){
            html_campo.checked = valor;
          } else if (tipo == "radio") {
            html_campo.checked = valor;
          } else if (tipo == "select"){
            if (valor == "sexo"){
              if (objeto_parseado[valor] == "V"){
                html_campo.selectedIndex = 1;  //masculino
              } else {
                html_campo.selectedIndex = 2;  //femenino
              }
            } else if (valor == "habitacion"){
              if (objeto_parseado[valor] == "suite"){
                html_campo.selectedIndex = 3; //suite
              } else if (objeto_parseado[valor] == "junior suite"){
                html_campo.selectedIndex = 2; //junior suite
              } else {
                html_campo.selectedIndex = 1; //normal
              }
            }
          } else {
            html_campo.value = objeto_parseado[valor];
          }
        }
      });
    }
  }

  //Obtiene por peticion REST la instancia elegida de la tabla en cuestion con todos sus atributos.
function getElemento(elemento, id){
  return new Promise(resolve => {
    let request = new XMLHttpRequest();
    let params = "http://localhost:49787/api/";

    adaptaToken().then(function(token){
      request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {

          resolve(request.responseText);
        }
      };
      
      request.open("GET", params + elemento + "/" + id, true);
      request.setRequestHeader("Authorization", token);
      request.send();
    });
  })
}

//Cada vez que se elija un nuevo ítem de la lista de forms, se ejecutará esta función que obtendrá
//el form almacenado en local y lo asignará a la variable responsable de manejarlo.
function getFormularioElegido(form_activo){
  return new Promise(resolve => {
    let request = new XMLHttpRequest();
    let params = "http://localhost:49787/XMLs/";

    request.onreadystatechange = function() {

      if (request.readyState == 4 && request.status == 200) {
        resolve(request.responseXML);
      }
    };

    request.open("GET", params + form_activo + ".xml", true);
    request.send();
  })
}

function adaptaToken(){
  return new Promise(resolve =>{
    let token_adaptado;
    let token_raw;

    chrome.storage.local.get("token", function(respuesta){
      token_raw = respuesta.token;
      token_adaptado = token_raw.replace('"','');
      token_adaptado= token_adaptado.replace('"','');
      resolve(token_adaptado);
      });
  })
}