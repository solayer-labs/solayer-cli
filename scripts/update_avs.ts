import { 
    SystemProgram, 
    PublicKey, 
    Keypair
} from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";
import endoavsProgramIDL from "./utils/endoavs_program.json";
import * as helper from "./utils/helpers";

async function updateAvs() {
    anchor.setProvider(anchor.AnchorProvider.env());
    const keypair = anchor.AnchorProvider.env().wallet as anchor.Wallet;
    const programId = new PublicKey("61XekENj7BjViMaVwBRQXEGmFH498kid61cABHDAkmMi");
    const endoavsProgram = new anchor.Program(endoavsProgramIDL as anchor.Idl, programId);
    const avsTokenMint = Keypair.generate()
    const endoavs = PublicKey.findProgramAddressSync([Buffer.from("endo_avs"), avsTokenMint.publicKey.toBuffer()], endoavsProgram.programId)[0]

    const newName = "NEW_NAME_GOES_HERE";
    const newURL = "NEW_URL_GOES_HERE";
    
    await endoavsProgram.methods.updateEndoavs(newName, newURL)
        .accounts({
            authority: keypair.publicKey ,
            endoAvs: endoavs,
            avsTokenMint: avsTokenMint.publicKey,
            systemProgram: SystemProgram.programId,
        }).signers([keypair.payer]).rpc().then(helper.log);

    const update_endoavs_info = await endoavsProgram.account.endoAvs.fetch(endoavs);
    console.log("new update_endoavs_info is : ", JSON.stringify(update_endoavs_info, null, 2))
}

updateAvs().then(() => { console.log("done") });