const express = require("express")
const app = express()
const handlebars = require("express-handlebars").engine
const bodyParser = require("body-parser")
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app')
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore')


//Importar módulo express-fileupload
const fileupload = require('express-fileupload');

//Habilitando o upload de arquivps
app.use(fileupload());
//Referenciar pasta de imagens
app.use('/static/imgs/imgs_bnc', express.static('./static/imgs/imgs_bnc'));


const serviceAccount = require('./firebase/chave-firebase.json')

initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore()

app.engine("handlebars", handlebars({
    defaultLayout: "main"
}))

app.set("view engine", "handlebars")

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static(__dirname))

//rota da pagina inicial que lista os produtos
app.get("/", async function(req, res){
    const dataSnapshot = await db.collection('produtos').get();
    const data = [];
  
    dataSnapshot.forEach((doc) => {
      data.push({
        id: doc.id,
        nome: doc.get('nome'),
        preco: doc.get('preco'),
        descricao: doc.get('descricao'),
        imagem: doc.get('imagem')
      });
    });

    res.render("index", {data})
});

//rota que acessa a pagina de cadastrar
app.get("/cadastroProduto", function(req, res){
  res.render("cadastroProduto")

})

//rota que cadastra os produtos
app.post("/cadastrarNovoProduto", function(req, res){
  var result = db.collection('produtos').add({
    nome: req.body.nome,
    preco: req.body.preco,
    descricao: req.body.descricao,
    imagem: req.files.imagem.name
  }).then(function(){
      console.log('Documento adicionado!');
      req.files.imagem.mv(__dirname+'/static/imgs/imgs_bnc/'+req.files.imagem.name);
      res.redirect('/')
  })
    
})


//rota que redireciona a pagina de atualização com os dados especifico
app.get("/editar/:id", async function(req, res){
  const dataSnapshot = await db.collection('produtos').doc(req.params.id).get();
  const data = {
    id: dataSnapshot.id,
    nome: dataSnapshot.get('nome'),
    preco: dataSnapshot.get('preco'),
    descricao: dataSnapshot.get('descricao'),
    imagem: dataSnapshot.get('imagem')
  };
  res.render("editarProduto", {data})
})


//rota que atualiza
app.post("/atualizarProduto", function(req, res){
  // Verificar se um novo arquivo de imagem foi enviado
  let novaImagem;
  if (req.files && req.files.nova_imagem) {
      novaImagem = req.files.nova_imagem.name;
      // Mover o arquivo para o diretório correto
      req.files.nova_imagem.mv(__dirname+'/static/imgs/imgs_bnc/'+novaImagem);
  } else {
      // Caso contrário, mantenha a imagem existente
      novaImagem = req.body.imagem;
  }

  // Criação de um objeto para atualizar
  let updateData = {};

  if (req.body.nome !== undefined) {
    updateData.nome = req.body.nome;
  }

  if (req.body.preco !== undefined) {
    updateData.preco = req.body.preco;
  }

  if (req.body.descricao !== undefined) {
    updateData.descricao = req.body.descricao;
  }

  if (novaImagem !== undefined) {
    updateData.imagem = novaImagem;
  }

  // Atualizar o documento no Firestore
  db.collection('produtos').doc(req.body.id).update(updateData)
  .then(function(){
    console.log('Documento atualizado!');
    res.redirect('/');
  })
});

//rota que deleta
app.get("/excluir/:id", function(req, res){
    db.collection('produtos').doc(req.params.id).delete().then(
      function(){
        console.log("deletado")
        res.redirect('/')
      }
    )
})


app.listen(8081, function(){
    console.log("Servidor ativo!")
})