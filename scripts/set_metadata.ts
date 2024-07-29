import { 
    SystemProgram, 
    PublicKey, 
    Keypair
} from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";
import endoavsProgramIDL from "./utils/endoavs_program.json";
import { METADATA_PROGRAM_ID } from '@solana/spl-stake-pool/dist/constants';
import { Metaplex } from "@metaplex-foundation/js";
import * as helper from "./utils/helpers";

async function updateMetadata() {
    anchor.setProvider(anchor.AnchorProvider.env());
    const provider = anchor.getProvider();
    const connection = provider.connection;
    const keypair = anchor.AnchorProvider.env().wallet as anchor.Wallet;
    const metaplex = new Metaplex(connection);
    const programId = new PublicKey("61XekENj7BjViMaVwBRQXEGmFH498kid61cABHDAkmMi");
    const endoavsProgram = new anchor.Program(endoavsProgramIDL as anchor.Idl, programId);
    const avs_token_mint = Keypair.generate()
    const endo_avs = PublicKey.findProgramAddressSync([Buffer.from("endo_avs"), avs_token_mint.publicKey.toBuffer()], endoavsProgram.programId)[0]

    try{
        const name      = "solayer-sSOL";
        const symbol    = "ssSOL";
        const uri       = "https://solayer.org"
        await endoavsProgram.methods.setAvsTokenMetadata(name, symbol, uri)
        .accounts({
            endo_avs:                   endo_avs,
            authority:                  keypair.publicKey,
            avsTokenMint:               avs_token_mint.publicKey,
            avsTokenMetadata:           metaplex.nfts().pdas().metadata({ mint: avs_token_mint.publicKey }),
            tokenMetadataProgram:       METADATA_PROGRAM_ID,
            system_program:             SystemProgram.programId,
            rent:                       anchor.web3.SYSVAR_RENT_PUBKEY
        }).signers([keypair.payer]).rpc().then(helper.log);
    } catch (error) {
        console.error("Error setting metadata:", error);
    }
}

updateMetadata().then(() => { console.log("done") });