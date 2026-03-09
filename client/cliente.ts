//////////////////// Imports ////////////////////
import { PublicKey } from "@solana/web3.js";

//////////////////// Constantes ////////////////////
const NOMBRE_RECETARIO = "RecetasSolana";
const owner = pg.wallet.publicKey;

//////////////////// Logs base ////////////////////
console.log("My address:", owner.toBase58());
const balance = await pg.connection.getBalance(owner);
console.log(`My balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);

//////////////////// PDA Recetario ////////////////////
// En Rust: seeds = [b"recetario", owner.key().as_ref()]
function pdaRecetario(ownerPk: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("recetario"), ownerPk.toBuffer()],
    pg.PROGRAM_ID
  );
}

//////////////////// Helpers ////////////////////
async function fetchRecetario(pda_recetario: PublicKey) {
  return await pg.program.account.recetario.fetch(pda_recetario);
}

function printRecetas(recetarioAccount: any) {

  const recetas = recetarioAccount.recetas as any[];

  if (!recetas || recetas.length === 0) {
    console.log("No hay recetas en el recetario");
    return;
  }

  console.log(`Recetas (${recetas.length}):`);

  for (let i = 0; i < recetas.length; i++) {

    const r = recetas[i];

    console.log(
      `#${i + 1} -> nombre="${r.nombre}", ingredientes="${r.ingredientes}", preparacion="${r.preparacion}", disponible=${r.disponible}`
    );
  }
}

//////////////////// Instrucciones ////////////////////

async function crearRecetario(nombreRecetario: string) {

  const [pda_recetario] = pdaRecetario(owner);

  try {

    const existing = await fetchRecetario(pda_recetario);

    console.log("Recetario ya existe en:", pda_recetario.toBase58());
    console.log("Owner guardado:", existing.owner.toBase58());
    console.log("Nombre guardado:", existing.nombre);

    return;

  } catch (_) {

  }

  const txHash = await pg.program.methods
    .crearRecetario(nombreRecetario)
    .accounts({
      owner: owner,
      recetario: pda_recetario,
    })
    .rpc();

  console.log("crearRecetario tx:", txHash);
  console.log("Recetario PDA:", pda_recetario.toBase58());

  const recetarioAccount = await fetchRecetario(pda_recetario);

  console.log("Estado inicial:");
  console.log("Owner:", recetarioAccount.owner.toBase58());
  console.log("Nombre:", recetarioAccount.nombre);

  printRecetas(recetarioAccount);
}

async function agregarReceta(nombre: string, ingredientes: string, preparacion: string) {

  const [pda_recetario] = pdaRecetario(owner);

  const txHash = await pg.program.methods
    .agregarReceta(nombre, ingredientes, preparacion)
    .accounts({
      owner: owner,
      recetario: pda_recetario,
    })
    .rpc();

  console.log("agregarReceta tx:", txHash);

  const recetarioAccount = await fetchRecetario(pda_recetario);

  printRecetas(recetarioAccount);
}

async function eliminarReceta(nombre: string) {

  const [pda_recetario] = pdaRecetario(owner);

  const txHash = await pg.program.methods
    .eliminarReceta(nombre)
    .accounts({
      owner: owner,
      recetario: pda_recetario,
    })
    .rpc();

  console.log("eliminarReceta tx:", txHash);

  const recetarioAccount = await fetchRecetario(pda_recetario);

  printRecetas(recetarioAccount);
}

async function alternarReceta(nombre: string) {

  const [pda_recetario] = pdaRecetario(owner);

  const txHash = await pg.program.methods
    .alternarReceta(nombre)
    .accounts({
      owner: owner,
      recetario: pda_recetario,
    })
    .rpc();

  console.log("alternarReceta tx:", txHash);

  const recetarioAccount = await fetchRecetario(pda_recetario);

  printRecetas(recetarioAccount);
}

async function verRecetasFetch() {

  const [pda_recetario] = pdaRecetario(owner);

  const recetarioAccount = await fetchRecetario(pda_recetario);

  console.log("Recetario PDA:", pda_recetario.toBase58());
  console.log("Owner:", recetarioAccount.owner.toBase58());
  console.log("Nombre:", recetarioAccount.nombre);

  printRecetas(recetarioAccount);
}

//////////////////// Demo runner ////////////////////

await crearRecetario(NOMBRE_RECETARIO);

await agregarReceta(
  "Tacos",
  "carne, tortillas, salsa",
  "cocinar carne y servir en tortilla"
);

await agregarReceta(
  "Quesadillas",
  "tortilla, queso",
  "poner queso en tortilla y calentar"
);

await alternarReceta("Quesadillas");

await eliminarReceta("Tacos");

await verRecetasFetch();
