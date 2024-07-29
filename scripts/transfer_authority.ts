import { 
    SystemProgram, 
    PublicKey, 
    Keypair, 
} from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";
import endoavsProgramIDL from "./utils/endoavs_program.json";
import * as helper from "./utils/helpers";

async function transferAuthority() {
    anchor.setProvider(anchor.AnchorProvider.env());
    const keypair = anchor.AnchorProvider.env().wallet as anchor.Wallet;
    const programId = new PublicKey("61XekENj7BjViMaVwBRQXEGmFH498kid61cABHDAkmMi");
    const endoavsProgram = new anchor.Program(endoavsProgramIDL as anchor.Idl, programId);
    const avsTokenMint = Keypair.generate()
    const endoavs = PublicKey.findProgramAddressSync([Buffer.from("endo_avs"), avsTokenMint.publicKey.toBuffer()], endoavsProgram.programId)[0]

    try{
        // This will fail unless the signer is the authority holder
        const newAuthority = new PublicKey("INSERT_NEW_AUTHORITY_HODLER");
        await endoavsProgram.methods.transferAuthority()
        .accounts({
            authority:      keypair.publicKey,
            endo_avs:       endoavs,
            new_authority:  newAuthority,
            avs_token_mint: avsTokenMint.publicKey,
            system_program: SystemProgram.programId,
            rent:           anchor.web3.SYSVAR_RENT_PUBKEY
        }).signers([keypair.payer]).rpc().then(helper.log);
    } catch (error) {
        console.error("Error transfering authority:", error);
    }
}

transferAuthority().then(() => { console.log("done") });