-- Keep shared ideas and history when an account is permanently deleted.
alter table public.profiles drop constraint profiles_id_fkey;
alter table public.profiles add constraint profiles_id_fkey foreign key(id) references auth.users(id) on delete cascade;
alter table private.attribution alter column creator_id drop not null;
alter table private.attribution drop constraint attribution_creator_id_fkey;
alter table private.attribution add constraint attribution_creator_id_fkey foreign key(creator_id) references public.profiles(id) on delete set null;
alter table private.revisions alter column actor drop not null;
alter table private.revisions drop constraint revisions_actor_fkey;
alter table private.revisions add constraint revisions_actor_fkey foreign key(actor) references public.profiles(id) on delete set null;
alter table private.audit alter column actor drop not null;
alter table private.audit drop constraint audit_actor_fkey;
alter table private.audit add constraint audit_actor_fkey foreign key(actor) references public.profiles(id) on delete set null;
alter table private.invitations drop constraint invitations_created_by_fkey;
alter table private.invitations add constraint invitations_created_by_fkey foreign key(created_by) references public.profiles(id) on delete cascade;

create or replace function public.admin_snapshot(p_actor uuid) returns jsonb language plpgsql security definer set search_path=private,public as $$
begin
 perform private.require_member(p_actor,true);
 return jsonb_build_object('members',(select coalesce(jsonb_agg(to_jsonb(p)),'[]') from public.profiles p),'history',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from (select a.id,coalesce(p.username,'Deleted user') actor,a.action,a.target,a.created_at from private.audit a left join public.profiles p on p.id=a.actor order by a.created_at desc limit 500)a),'attribution',(select coalesce(jsonb_object_agg(idea_id,creator_id),'{}') from private.attribution));
end$$;

create function public.delete_idea_permanently(p_actor uuid,p_id uuid,p_version integer) returns void language plpgsql security invoker set search_path=public,private as $$
declare existing_version integer;
begin
 perform private.require_member(p_actor,true);
 select version into existing_version from public.ideas where id=p_id for update;
 if not found then raise exception 'idea_missing'; end if;
 if existing_version<>p_version then raise exception 'version_conflict'; end if;
 delete from private.revisions where idea_id=p_id;
 delete from private.attribution where idea_id=p_id;
 delete from public.ideas where id=p_id;
 insert into private.audit(actor,action,target) values(p_actor,'Idea permanently deleted',p_id);
end$$;
revoke all on function public.delete_idea_permanently(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.delete_idea_permanently(uuid,uuid,integer) to service_role;

grant execute on function private.require_member(uuid,boolean) to service_role;
