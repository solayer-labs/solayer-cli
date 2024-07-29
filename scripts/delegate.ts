import { 
    SystemProgram, 
    PublicKey, 
    Keypair, 
    LAMPORTS_PER_SOL
} from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";
import endoavsProgramIDL from "./utils/endoavs_program.json";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import BN from "bn.js";
import * as helper from "./utils/helpers";

async function delegate() {
    anchor.setProvider(anchor.AnchorProvider.env());
    const keypair = anchor.AnchorProvider.env().wallet as anchor.Wallet;
    const programId = new PublicKey("61XekENj7BjViMaVwBRQXEGmFH498kid61cABHDAkmMi");
    const endoavsProgram = new anchor.Program(endoavsProgramIDL as anchor.Idl, programId);
    const avsTokenMint = Keypair.generate()
    const endoavs = PublicKey.findProgramAddressSync([Buffer.from("endo_avs"), avsTokenMint.publicKey.toBuffer()], endoavsProgram.programId)[0]
    const delegateTokenMint = new PublicKey("8doaCnhsE5Ppi5dNHhAZwTQtYS4gVy28CWRcfmMuRKPk");

    try{
        await endoavsProgram.methods.delegate(new BN(15 * LAMPORTS_PER_SOL))
        .accounts({
            staker:                         keypair.publicKey,
            endoAvs:                        endoavs,
            avsTokenMint:                   avsTokenMint.publicKey,
            delegatedTokenVault:            getAssociatedTokenAddressSync(delegateTokenMint, endoavs, true),
            delegatedTokenMint:             delegateTokenMint,
            stakerDelegatedTokenAccount:    getAssociatedTokenAddressSync(delegateTokenMint, keypair.publicKey, true),
            stakerAvsTokenAccount:          getAssociatedTokenAddressSync(avsTokenMint.publicKey, keypair.publicKey, true),
            tokenProgram:                   TOKEN_PROGRAM_ID,
            associatedTokenProgram:         ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram:                  SystemProgram.programId,
            rent:                           anchor.web3.SYSVAR_RENT_PUBKEY
        }).signers([keypair.payer]).rpc().then(helper.log);
    } catch (error) {
        console.error("Error delegating:", error);
    }

    try{
        await endoavsProgram.methods.undelegate(new BN(15 * LAMPORTS_PER_SOL))
        .accounts({
            staker: keypair.publicKey,
            endoAvs: endoavs,
            avsTokenMint: avsTokenMint.publicKey,
            delegatedTokenVault: getAssociatedTokenAddressSync(delegateTokenMint, endoavs, true),
            delegatedTokenMint: delegateTokenMint,
            stakerDelegatedTokenAccount: getAssociatedTokenAddressSync(delegateTokenMint, keypair.publicKey, true),
            stakerAvsTokenAccount: getAssociatedTokenAddressSync(avsTokenMint.publicKey, keypair.publicKey, true),
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
        }).signers([keypair.payer]).rpc().then(helper.log);
    } catch (error) {
        console.error("Error undelegating:", error);
    }
}

delegate().then(() => { console.log("done") });