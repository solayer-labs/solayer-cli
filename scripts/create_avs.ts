import { 
    SystemProgram, 
    PublicKey, 
    Keypair
} from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";
import endoavsProgramIDL from "./utils/endoavs_program.json";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { METADATA_PROGRAM_ID } from '@solana/spl-stake-pool/dist/constants';
import { Metaplex } from "@metaplex-foundation/js";
import * as helper from "./utils/helpers";

async function endoavs() {
    anchor.setProvider(anchor.AnchorProvider.env());
    const provider = anchor.getProvider();
    const connection = provider.connection;
    const keypair = anchor.AnchorProvider.env().wallet as anchor.Wallet;
    const metaplex = new Metaplex(connection);
    const programId = new PublicKey("61XekENj7BjViMaVwBRQXEGmFH498kid61cABHDAkmMi");
    const endoavsProgram = new anchor.Program(endoavsProgramIDL as anchor.Idl, programId);
    const avsTokenMint = Keypair.generate()
    const endoavs = PublicKey.findProgramAddressSync([Buffer.from("endo_avs"), avsTokenMint.publicKey.toBuffer()], endoavsProgram.programId)[0]
    const delegatedTokenMint = new PublicKey("8doaCnhsE5Ppi5dNHhAZwTQtYS4gVy28CWRcfmMuRKPk");

    try{
        const avsName = "NAME_GOES_HERE";
        await endoavsProgram.methods
        .create(avsName)
            .accounts({
                endoAvs:                endoavs,
                authority:              ASSOCIATED_TOKEN_PROGRAM_ID,
                avsTokenMint:           avsTokenMint.publicKey,
                avsTokenMetadata:       metaplex.nfts().pdas().metadata({ mint: avsTokenMint.publicKey }),
                delegatedTokenVault:    getAssociatedTokenAddressSync(delegatedTokenMint, endoavs, true),
                delegatedTokenMint:     delegatedTokenMint,
                tokenProgram:           TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenMetadataProgram:   METADATA_PROGRAM_ID,
                systemProgram:          SystemProgram.programId,
                rent:                   anchor.web3.SYSVAR_RENT_PUBKEY
            }).signers([keypair.payer, avsTokenMint]).rpc().then(helper.log);
    } catch (error) {
        console.error("Error creating endogenous AVS:", error);
    }
}

endoavs().then(() => { console.log("done") });