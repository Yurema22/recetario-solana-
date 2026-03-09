use anchor_lang::prelude::*;

declare_id!("Bo1T1bQ1EU5TdFnNJdWyYRoJkB4GDyZs6eYPHTeHJTXV");

#[program]
pub mod recetario {
    use super::*;

    pub fn crear_recetario(context: Context<NuevoRecetario>, nombre: String) -> Result<()> {
        let owner_id = context.accounts.owner.key();
        let recetas: Vec<Recipe> = vec![];

        context.accounts.recetario.set_inner(Recetario {
            owner: owner_id,
            nombre,
            recetas,
        });

        Ok(())
    }

    pub fn agregar_receta(
        context: Context<NuevaReceta>,
        nombre: String,
        ingredientes: String,
        preparacion: String
    ) -> Result<()> {

        require!(
            context.accounts.recetario.owner == context.accounts.owner.key(),
            Errores::NoEresElOwner
        );

        let receta = Recipe {
            nombre,
            ingredientes,
            preparacion,
            disponible: true,
        };

        context.accounts.recetario.recetas.push(receta);

        Ok(())
    }

    pub fn ver_recetas(context: Context<NuevaReceta>) -> Result<()> {

        require!(
            context.accounts.recetario.owner == context.accounts.owner.key(),
            Errores::NoEresElOwner
        );

        msg!("La lista de recetas es: {:#?}", context.accounts.recetario.recetas);

        Ok(())
    }

    pub fn eliminar_receta(context: Context<NuevaReceta>, nombre: String) -> Result<()> {

        require!(
            context.accounts.recetario.owner == context.accounts.owner.key(),
            Errores::NoEresElOwner
        );

        let recetas = &mut context.accounts.recetario.recetas;

        for i in 0..recetas.len() {
            if recetas[i].nombre == nombre {
                recetas.remove(i);
                msg!("Receta {} eliminada", nombre);
                return Ok(())
            }
        }

        Err(Errores::RecetaNoExiste.into())
    }

    pub fn alternar_receta(context: Context<NuevaReceta>, nombre: String) -> Result<()> {

        require!(
            context.accounts.recetario.owner == context.accounts.owner.key(),
            Errores::NoEresElOwner
        );

        let recetas = &mut context.accounts.recetario.recetas;

        for i in 0..recetas.len() {

            let estado = recetas[i].disponible;

            if recetas[i].nombre == nombre {

                let nuevo_estado = !estado;

                recetas[i].disponible = nuevo_estado;

                msg!(
                    "La receta: {} ahora tiene disponibilidad: {}",
                    nombre,
                    nuevo_estado
                );

                return Ok(())
            }
        }

        Err(Errores::RecetaNoExiste.into())
    }
}

#[error_code]
pub enum Errores {

    #[msg("Error, no eres el propietario de la cuenta.")]
    NoEresElOwner,

    #[msg("Error, la receta proporcionada no existe.")]
    RecetaNoExiste,
}

#[account]
#[derive(InitSpace)]
pub struct Recetario {

    owner: Pubkey,

    #[max_len(60)]
    nombre: String,

    #[max_len(10)]
    recetas: Vec<Recipe>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq, Debug)]
pub struct Recipe {

    #[max_len(60)]
    nombre: String,

    #[max_len(200)]
    ingredientes: String,

    #[max_len(300)]
    preparacion: String,

    disponible: bool,
}

#[derive(Accounts)]
pub struct NuevoRecetario<'info> {

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = Recetario::INIT_SPACE + 8,
        seeds = [b"recetario", owner.key().as_ref()],
        bump
    )]
    pub recetario: Account<'info, Recetario>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct NuevaReceta<'info> {

    pub owner: Signer<'info>,

    #[account(mut)]
    pub recetario: Account<'info, Recetario>,
}
