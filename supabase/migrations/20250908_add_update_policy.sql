-- Agregar política de actualización para egresos
create policy "Usuarios pueden actualizar sus propios egresos"
    on egresos for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
