import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BellRing,
  Building2,
  CheckCircle2,
  GraduationCap,
  Info,
  Megaphone,
  MessageCircle,
  School,
  Send,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Aula, Estudiante, UserAccount } from '../../types';

interface ChatContact {
  key: string;
  docenteUsuarioId: string;
  padreUsuarioId: string;
  estudiante: Estudiante;
  counterpart: UserAccount;
  aula?: Aula;
}

const classroomLabel = (aula?: Aula) =>
  aula ? `${aula.nivel} ${aula.grado} “${aula.seccion}”` : 'Aula sin identificar';

export const CommunicationCenter: React.FC = () => {
  const {
    currentUser,
    currentRole,
    aulas,
    estudiantes,
    usuarios,
    comunicados,
    mensajesChat,
    addComunicado,
    sendChatMessage,
    markChatMessagesAsRead,
    activeTab,
    setActiveTab,
  } = useApp();

  const canChat = currentRole === 'docente' || currentRole === 'padre';
  const [section, setSection] = useState<'comunicados' | 'chat'>(
    activeTab === 'mensajes' && canChat ? 'chat' : 'comunicados'
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedAulaId, setSelectedAulaId] = useState(currentUser.assignedAulas?.[0] || '');
  const [selectedContactKey, setSelectedContactKey] = useState('');
  const [chatText, setChatText] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setSection(activeTab === 'mensajes' && canChat ? 'chat' : 'comunicados');
  }, [activeTab, canChat]);

  const teacherAccount = useMemo(() => {
    if (currentRole !== 'docente') return null;
    return usuarios.find(user => user.id === currentUser.id) || null;
  }, [currentRole, currentUser.id, usuarios]);

  const teacherAulaIds = currentRole === 'docente'
    ? (currentUser.assignedAulas || teacherAccount?.assignedAulas || [])
    : [];
  const teacherAulas = aulas.filter(aula => teacherAulaIds.includes(aula.id));

  useEffect(() => {
    if (currentRole === 'docente' && !teacherAulaIds.includes(selectedAulaId)) {
      setSelectedAulaId(teacherAulaIds[0] || '');
    }
  }, [currentRole, selectedAulaId, teacherAulaIds.join('|')]);

  const child = currentRole === 'padre'
    ? estudiantes.find(student =>
        student.id === currentUser.estudianteId ||
        student.dni === currentUser.dni ||
        student.correoApoderado?.toLowerCase() === currentUser.email.toLowerCase()
      )
    : undefined;

  const visibleAnnouncements = comunicados.filter((announcement) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'docente') {
      return announcement.alcance === 'colegio' ||
        (Boolean(announcement.aulaId) && teacherAulaIds.includes(announcement.aulaId!));
    }
    return announcement.alcance === 'colegio' ||
      (Boolean(child?.aulaId) && announcement.aulaId === child?.aulaId);
  });

  const chatContacts = useMemo<ChatContact[]>(() => {
    if (currentRole === 'docente') {
      return estudiantes
        .filter(student => teacherAulaIds.includes(student.aulaId))
        .flatMap(student => {
          const parentAccount = usuarios.find(
            user => user.rol === 'padre' && user.estudianteId === student.id
          );
          if (!parentAccount) return [];
          return [{
            key: `${currentUser.id}:${parentAccount.id}:${student.id}`,
            docenteUsuarioId: currentUser.id,
            padreUsuarioId: parentAccount.id,
            estudiante: student,
            counterpart: parentAccount,
            aula: aulas.find(aula => aula.id === student.aulaId),
          }];
        });
    }

    if (currentRole === 'padre' && child) {
      return usuarios
        .filter(user => user.rol === 'docente' && user.assignedAulas?.includes(child.aulaId))
        .map(teacher => ({
          key: `${teacher.id}:${currentUser.id}:${child.id}`,
          docenteUsuarioId: teacher.id,
          padreUsuarioId: currentUser.id,
          estudiante: child,
          counterpart: teacher,
          aula: aulas.find(aula => aula.id === child.aulaId),
        }));
    }

    return [];
  }, [aulas, child, currentRole, currentUser.id, estudiantes, teacherAulaIds.join('|'), usuarios]);

  useEffect(() => {
    if (!chatContacts.some(contact => contact.key === selectedContactKey)) {
      setSelectedContactKey(chatContacts[0]?.key || '');
    }
  }, [chatContacts, selectedContactKey]);

  const selectedContact =
    chatContacts.find(contact => contact.key === selectedContactKey) || chatContacts[0];
  const conversation = selectedContact
    ? mensajesChat.filter(message =>
        message.docenteUsuarioId === selectedContact.docenteUsuarioId &&
        message.padreUsuarioId === selectedContact.padreUsuarioId &&
        message.estudianteId === selectedContact.estudiante.id
      )
    : [];

  useEffect(() => {
    if (section === 'chat' && selectedContact) {
      markChatMessagesAsRead(
        selectedContact.docenteUsuarioId,
        selectedContact.padreUsuarioId,
        selectedContact.estudiante.id
      );
    }
  }, [section, selectedContact?.key]);

  const unreadForContact = (contact: ChatContact) =>
    mensajesChat.filter(message =>
      message.docenteUsuarioId === contact.docenteUsuarioId &&
      message.padreUsuarioId === contact.padreUsuarioId &&
      message.estudianteId === contact.estudiante.id &&
      message.remitenteId !== currentUser.id &&
      !message.leido
    ).length;

  const handlePublish = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    const targetAula = currentRole === 'docente'
      ? teacherAulas.find(aula => aula.id === selectedAulaId)
      : undefined;
    if (currentRole === 'docente' && !targetAula) {
      setFeedback({ type: 'error', text: 'Selecciona una de tus aulas asignadas.' });
      return;
    }

    setSending(true);
    const result = await addComunicado({
      titulo: title.trim(),
      descripcion: body.trim(),
      autor: currentUser.name,
      autorId: currentUser.id,
      autorRol: currentRole === 'admin' ? 'Administrador' : 'Docente',
      alcance: currentRole === 'admin' ? 'colegio' : 'aula',
      aulaId: targetAula?.id,
      aulaDestino: currentRole === 'admin' ? 'Todo el colegio' : classroomLabel(targetAula),
      nivelDestino: currentRole === 'admin' ? 'Todos' : targetAula?.nivel,
    });
    setSending(false);

    if (!result.success) {
      setFeedback({ type: 'error', text: result.error || 'No se pudo publicar.' });
      return;
    }
    setTitle('');
    setBody('');
    setFeedback({
      type: 'success',
      text: currentRole === 'admin'
        ? 'Comunicado enviado a todas las familias.'
        : `Comunicado enviado únicamente a ${classroomLabel(targetAula)}.`,
    });
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedContact || !chatText.trim()) return;

    setSending(true);
    const result = await sendChatMessage({
      docenteUsuarioId: selectedContact.docenteUsuarioId,
      padreUsuarioId: selectedContact.padreUsuarioId,
      estudianteId: selectedContact.estudiante.id,
      remitenteId: currentUser.id,
      remitenteRol: currentRole === 'docente' ? 'docente' : 'padre',
      contenido: chatText,
    });
    setSending(false);

    if (result.success) {
      setChatText('');
      setFeedback(null);
    } else {
      setFeedback({ type: 'error', text: result.error || 'No se pudo enviar el mensaje.' });
    }
  };

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-red-700 via-red-800 to-rose-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              Comunicación interna segura
            </span>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              Comunicados y acompañamiento familiar
            </h2>
            <p className="text-sm leading-6 text-red-100">
              Toda la comunicación permanece dentro del sistema y respeta las aulas y estudiantes asociados a cada usuario.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[310px]">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-black">{visibleAnnouncements.length}</p>
              <p className="mt-1 text-[11px] font-semibold text-red-100">Comunicados visibles</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-black">{canChat ? chatContacts.length : usuarios.filter(u => u.rol === 'padre').length}</p>
              <p className="mt-1 text-[11px] font-semibold text-red-100">
                {canChat ? 'Conversaciones disponibles' : 'Familias destinatarias'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {canChat && (
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <button
            onClick={() => {
              setSection('comunicados');
              setActiveTab('comunicados');
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
              section === 'comunicados' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Megaphone className="h-4 w-4" />
            Comunicados
          </button>
          <button
            onClick={() => {
              setSection('chat');
              setActiveTab('mensajes');
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
              section === 'chat' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Chat privado
          </button>
        </div>
      )}

      {section === 'comunicados' ? (
        <div className={`grid gap-6 ${currentRole === 'padre' ? 'grid-cols-1' : 'xl:grid-cols-[380px_minmax(0,1fr)]'}`}>
          {currentRole !== 'padre' && (
            <section className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start gap-3">
                <span className="rounded-2xl bg-red-50 p-3 text-red-600">
                  <Megaphone className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-black text-slate-900">Nuevo comunicado</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {currentRole === 'admin'
                      ? 'Se notificará a todas las familias del colegio.'
                      : 'Solo puedes seleccionar una de tus aulas asignadas.'}
                  </p>
                </div>
              </div>

              <form onSubmit={handlePublish} className="space-y-4">
                <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-xs text-red-800">
                  <div className="flex items-center gap-2 font-extrabold">
                    {currentRole === 'admin' ? <School className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    Destinatarios
                  </div>
                  {currentRole === 'admin' ? (
                    <p className="mt-1.5 text-[11px]">Todo el colegio · Todas las familias</p>
                  ) : (
                    <select
                      value={selectedAulaId}
                      onChange={event => setSelectedAulaId(event.target.value)}
                      required
                      className="mt-2 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                    >
                      {teacherAulas.map(aula => (
                        <option key={aula.id} value={aula.id}>{classroomLabel(aula)}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label htmlFor="announcement-title" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Título
                  </label>
                  <input
                    id="announcement-title"
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                    required
                    maxLength={120}
                    placeholder="Ej. Reunión de familias"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                  />
                </div>

                <div>
                  <label htmlFor="announcement-body" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Mensaje
                  </label>
                  <textarea
                    id="announcement-body"
                    value={body}
                    onChange={event => setBody(event.target.value)}
                    required
                    rows={6}
                    maxLength={1500}
                    placeholder="Escribe información clara, fecha, hora y recomendaciones..."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                  />
                  <p className="mt-1 text-right text-[10px] text-slate-400">{body.length}/1500</p>
                </div>

                {feedback && (
                  <div className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${
                    feedback.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}>
                    {feedback.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending || !title.trim() || !body.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-xs font-extrabold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {sending ? 'Publicando...' : 'Publicar en el sistema'}
                </button>
              </form>
            </section>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-slate-900">
                  {currentRole === 'padre' ? 'Comunicados para tu familia' : 'Historial de comunicados'}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {currentRole === 'padre' && child
                    ? `Solo se muestran avisos generales y de ${child.nivel} ${child.grado} “${child.seccion}”.`
                    : 'Registro de publicaciones disponibles según tus permisos.'}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-extrabold text-slate-500">
                {visibleAnnouncements.length} publicaciones
              </span>
            </div>

            <div className="space-y-3">
              {visibleAnnouncements.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
                  <BellRing className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-600">Aún no hay comunicados para mostrar</p>
                  <p className="mt-1 text-xs text-slate-400">Las nuevas publicaciones aparecerán aquí.</p>
                </div>
              ) : (
                visibleAnnouncements.map(announcement => (
                  <article key={announcement.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-red-200 hover:bg-red-50/40 sm:p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 gap-3">
                        <span className={`mt-0.5 rounded-xl p-2.5 ${
                          announcement.alcance === 'colegio'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {announcement.alcance === 'colegio'
                            ? <School className="h-4 w-4" />
                            : <Building2 className="h-4 w-4" />}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-slate-900">{announcement.titulo}</h4>
                          <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-600">{announcement.descripcion}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold text-slate-400">{announcement.fecha}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 text-[10px]">
                      <span className="rounded-full bg-white px-2.5 py-1 font-bold text-red-700">
                        Para: {announcement.aulaDestino}
                      </span>
                      <span className="text-slate-500">Publicado por {announcement.autor}</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      ) : (
        <section className="grid min-h-[620px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-slate-50/70 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 p-5">
              <h3 className="font-black text-slate-900">Conversaciones</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {currentRole === 'docente'
                  ? 'Familias de estudiantes de tus aulas.'
                  : 'Docentes vinculados al aula de tu hijo(a).'}
              </p>
            </div>

            <div className="max-h-[540px] space-y-1 overflow-y-auto p-3">
              {chatContacts.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-3 text-xs font-semibold text-slate-500">No hay contactos asociados.</p>
                </div>
              ) : (
                chatContacts.map(contact => {
                  const unread = unreadForContact(contact);
                  const active = contact.key === selectedContact?.key;
                  return (
                    <button
                      key={contact.key}
                      onClick={() => setSelectedContactKey(contact.key)}
                      className={`w-full rounded-2xl p-3 text-left transition ${
                        active ? 'bg-red-600 text-white shadow-md' : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          active ? 'bg-white/15' : 'bg-red-100 text-red-700'
                        }`}>
                          {currentRole === 'docente' ? <UserRound className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-extrabold">{contact.counterpart.nombre}</p>
                            {unread > 0 && (
                              <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-black ${
                                active ? 'bg-white text-red-700' : 'bg-rose-500 text-white'
                              }`}>{unread}</span>
                            )}
                          </div>
                          <p className={`mt-1 truncate text-[10px] ${active ? 'text-red-100' : 'text-slate-500'}`}>
                            Por {contact.estudiante.nombres} · {classroomLabel(contact.aula)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <div className="flex min-h-[540px] flex-col">
            {selectedContact ? (
              <>
                <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-sm font-black text-slate-900">{selectedContact.counterpart.nombre}</p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-500">
                      Conversación sobre {selectedContact.estudiante.nombres} {selectedContact.estudiante.apellidos}
                    </p>
                  </div>
                  <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold text-emerald-700 sm:flex">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Chat privado
                  </span>
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-5">
                  <div className="mx-auto mb-5 flex max-w-md items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-[10px] leading-5 text-red-800">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    Esta conversación solo es visible para el docente y el apoderado vinculados al estudiante.
                  </div>

                  {conversation.length === 0 ? (
                    <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                      <MessageCircle className="h-10 w-10 text-slate-300" />
                      <p className="mt-3 text-sm font-bold text-slate-600">Inicia la conversación</p>
                      <p className="mt-1 text-xs text-slate-400">Los mensajes quedarán registrados en el sistema.</p>
                    </div>
                  ) : (
                    conversation.map(message => {
                      const own = message.remitenteId === currentUser.id;
                      return (
                        <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-5 shadow-sm sm:max-w-[70%] ${
                            own
                              ? 'rounded-br-md bg-red-600 text-white'
                              : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'
                          }`}>
                            <p className="whitespace-pre-wrap">{message.contenido}</p>
                            <div className={`mt-1.5 flex items-center justify-end gap-1 text-[9px] ${
                              own ? 'text-red-100' : 'text-slate-400'
                            }`}>
                              <span>{message.fechaHora.split(' ')[1]?.slice(0, 5)}</span>
                              {own && message.leido && <CheckCircle2 className="h-3 w-3" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-4">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={chatText}
                      onChange={event => setChatText(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      rows={2}
                      maxLength={1000}
                      placeholder="Escribe un mensaje privado..."
                      className="min-h-[48px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-900 outline-none focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                    />
                    <button
                      type="submit"
                      disabled={sending || !chatText.trim()}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:opacity-50"
                      title="Enviar mensaje"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <MessageCircle className="h-11 w-11 text-slate-300" />
                <p className="mt-4 text-sm font-black text-slate-600">Sin conversaciones disponibles</p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Debe existir una relación entre docente, aula, estudiante y apoderado.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
