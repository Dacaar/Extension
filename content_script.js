'use strict';

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
  
  if (msg.configurado == "si"){

  } else {
    getFormularioElegido(msg.formulario).then(function(fichero_xml){
      ejecutarAutorrellenado(fichero_xml);
    });
  }

})

function ejecutarAutorrellenado(xml){
    let tablas = xml.getElementsByTagName("tabla"); //Esto recibe todos los nodos tabla (una colección).
    let objeto_parseado;

    for (var i = 0; i < tablas.length; i++){  //Recorre las tablas de la BBDD que se usaran en el form.
      //Obtiene el valor del atributo "valor" de la tabla cuyo índice es i.
      let nombre = tablas[i].attributes.getNamedItem("valor").value;
  
      //Obtenemos un objeto de la tabla del servidor, con índice arbitrario (Dado por mí).

      let campos = tablas[i].getElementsByTagName("campo");
      //alert("campos1"+campos)
      getElemento(nombre).then(function(objeto){
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
function getElemento(elemento){
  return new Promise(resolve => {
    let request = new XMLHttpRequest();
    let params = "http://localhost:49787/api/";
    let objeto_obtenido;
    
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == 200) {
        objeto_obtenido = request.responseText;
        resolve(objeto_obtenido);
      }
    };
    
    request.open("GET", params + elemento + "/1", true)
    request.send();
  })
}

//Cada vez que se elija un nuevo ítem de la lista de forms, se ejecutará esta función que obtendrá
//el form almacenado en local y lo asignará a la variable responsable de manejarlo.
function getFormularioElegido(form_activo){
  return new Promise(resolve => {
    let request = new XMLHttpRequest();
    let params = "http://localhost:49787/XMLs/";
  
    //alert("jc0 rs:"+request.readyState+"jc0 s: "+request.status);
    request.onreadystatechange = function() {
      //alert("jc1 rs: "+request.readyState+"jc1 s: "+request.status);
      if (request.readyState == 4 && request.status == 200) {
        resolve(request.responseXML);
      }
    };

    request.open("GET", params + form_activo + ".xml", true);
    request.send();
  })
}
