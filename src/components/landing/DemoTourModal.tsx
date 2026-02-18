import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  X,
  LayoutDashboard,
  Calendar,
  DollarSign,
  Users,
  MessageCircle,
  Megaphone,
  Building2,
  TrendingUp,
  Clock,
  Scissors,
  Star,
  CheckCircle,
  QrCode,
  Send,
  Bell,
  Gift,
  BarChart3,
  Volume2,
  VolumeX,
  Loader2,
  Bot,
  UserCheck,
  RefreshCcw,
} from "lucide-react";

interface DemoTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Narration texts for each slide
const narrationTexts = [
  "Bem-vindo ao BarberSoft! Vou te mostrar como o sistema funciona na prática. Navegue pelos slides para conhecer cada funcionalidade. Vamos lá!",
  "Painel de Controle Inteligente. Acompanhe faturamento, agendamentos, clientes e ticket médio em tempo real. Veja o desempenho semanal da sua barbearia e os próximos horários agendados, tudo em uma tela.",
  "Agenda Completa. Gerencie seus agendamentos por dia, semana ou mês. Filtre por profissional, veja os detalhes de cada atendimento e organize a rotina da sua equipe com um calendário visual e intuitivo.",
  "Controle Financeiro Total. Tenha controle completo do caixa da sua barbearia. Acompanhe receita, despesas e lucro em tempo real. Veja as comissões de cada profissional calculadas automaticamente.",
  "Conheça o Jackson, seu gerente virtual. Ele atende seus clientes pelo WhatsApp 24 horas por dia, faz o cadastro automaticamente e agenda o horário sem precisar de ninguém. O cliente manda uma mensagem, o Jackson entende o que ele precisa, verifica a disponibilidade e confirma o agendamento na hora.",
  "Gestão de Clientes. Acesse o histórico completo de cada cliente, identifique os VIPs, acompanhe a frequência de visitas e o programa de fidelidade. Nunca mais perca um aniversário.",
  "Integração WhatsApp. Conecte seu WhatsApp em segundos escaneando um QR Code. Configure lembretes automáticos de agendamento, mensagens de aniversário e resgate de clientes inativos.",
  "Marketing Inteligente. Envie campanhas em massa pelo WhatsApp, acompanhe taxas de abertura e conversões. Automatize lembretes de aniversário e recupere clientes que não voltaram há muito tempo.",
  "Gestão Multi-Unidades. Gerencie todas as suas filiais de forma centralizada. Acompanhe o faturamento, agendamentos e desempenho de cada unidade em um só painel.",
];

// Intro/Welcome Slide
const IntroSlide = () => (
  <div className="bg-background/95 rounded-xl border border-border/50 p-4 md:p-6 h-full flex flex-col items-center justify-center text-center">
    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 animate-scale-in">
      <Volume2 className="w-8 h-8 text-primary" />
    </div>
    <h2 className="text-2xl font-bold text-foreground mb-3 animate-fade-in">Bem-vindo ao BarberSoft!</h2>
    <p className="text-muted-foreground max-w-md mb-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
      Vou te mostrar como o sistema funciona na prática. Ative o som para ouvir a narração enquanto navega pelos slides.
    </p>
    <div className="flex items-center gap-2 text-sm text-primary animate-fade-in" style={{ animationDelay: "400ms" }}>
      <ChevronRight className="w-4 h-4 animate-pulse" />
      <span>Clique na seta para começar</span>
    </div>
  </div>
);

// Dashboard Preview Slide
const DashboardSlide = () => (
  <div className="bg-background/95 rounded-xl border border-border/50 p-4 md:p-6 h-full">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <LayoutDashboard className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">Dashboard</span>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {[
        { label: "Faturamento", value: "R$ 12.450", icon: DollarSign, change: "+12%" },
        { label: "Agendamentos", value: "48", icon: Calendar, change: "+8%" },
        { label: "Clientes", value: "156", icon: Users, change: "+5%" },
        { label: "Ticket Médio", value: "R$ 85", icon: TrendingUp, change: "+3%" },
      ].map((metric, i) => (
        <div 
          key={i} 
          className="bg-card/50 rounded-lg p-3 border border-border/30 animate-fade-in"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <metric.icon className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-muted-foreground">{metric.label}</span>
          </div>
          <div className="text-lg font-bold text-foreground">{metric.value}</div>
          <span className="text-[10px] text-green-400">{metric.change}</span>
        </div>
      ))}
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-card/30 rounded-lg p-3 border border-border/30">
        <div className="text-xs text-muted-foreground mb-2">Faturamento Semanal</div>
        <div className="flex items-end gap-1 h-20">
          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
            <div 
              key={i} 
              className="flex-1 bg-gradient-to-t from-primary/60 to-primary rounded-t animate-scale-in"
              style={{ height: `${h}%`, animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>
      <div className="bg-card/30 rounded-lg p-3 border border-border/30">
        <div className="text-xs text-muted-foreground mb-2">Próximos Horários</div>
        <div className="space-y-2">
          {[
            { time: "10:00", client: "João Silva", service: "Corte" },
            { time: "10:30", client: "Pedro Santos", service: "Barba" },
            { time: "11:00", client: "Carlos Lima", service: "Combo" },
          ].map((apt, i) => (
            <div key={i} className="flex items-center gap-2 text-xs animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <Clock className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground">{apt.time}</span>
              <span className="text-foreground">{apt.client}</span>
              <span className="text-primary ml-auto">{apt.service}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Agenda Preview Slide
const AgendaSlide = () => (
  <div className="bg-background/95 rounded-xl border border-border/50 p-4 md:p-6 h-full">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <Calendar className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">Agenda</span>
      <div className="ml-auto flex gap-1">
        {["Dia", "Semana", "Mês"].map((v, i) => (
          <button key={i} className={`px-2 py-1 text-[10px] rounded ${i === 1 ? 'bg-primary text-primary-foreground' : 'bg-card/50 text-muted-foreground'}`}>
            {v}
          </button>
        ))}
      </div>
    </div>
    
    <div className="grid grid-cols-7 gap-1 mb-3">
      {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day, i) => (
        <div key={i} className="text-center text-[10px] text-muted-foreground py-1">{day}</div>
      ))}
    </div>
    
    <div className="space-y-2">
      {[
        { time: "09:00", appointments: [{ name: "João", service: "Corte", barber: "Carlos", color: "bg-blue-500/30" }] },
        { time: "10:00", appointments: [{ name: "Pedro", service: "Barba", barber: "Carlos", color: "bg-green-500/30" }, { name: "Lucas", service: "Corte", barber: "André", color: "bg-purple-500/30" }] },
        { time: "11:00", appointments: [{ name: "Marcos", service: "Combo", barber: "André", color: "bg-primary/30" }] },
        { time: "14:00", appointments: [{ name: "Rafael", service: "Corte", barber: "Carlos", color: "bg-orange-500/30" }] },
      ].map((slot, i) => (
        <div key={i} className="flex gap-2 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="w-12 text-[10px] text-muted-foreground pt-1">{slot.time}</div>
          <div className="flex-1 flex gap-1">
            {slot.appointments.map((apt, j) => (
              <div key={j} className={`flex-1 ${apt.color} rounded p-2 border border-border/30`}>
                <div className="text-xs font-medium text-foreground">{apt.name}</div>
                <div className="text-[10px] text-muted-foreground">{apt.service} • {apt.barber}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Financeiro Preview Slide
const FinanceiroSlide = () => (
  <div className="bg-background/95 rounded-xl border border-border/50 p-4 md:p-6 h-full">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <DollarSign className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">Financeiro</span>
    </div>
    
    <div className="grid grid-cols-3 gap-3 mb-4">
      {[
        { label: "Receita", value: "R$ 15.800", color: "text-green-400" },
        { label: "Despesas", value: "R$ 3.200", color: "text-red-400" },
        { label: "Lucro", value: "R$ 12.600", color: "text-primary" },
      ].map((item, i) => (
        <div key={i} className="bg-card/50 rounded-lg p-3 border border-border/30 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="text-[10px] text-muted-foreground mb-1">{item.label}</div>
          <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
        </div>
      ))}
    </div>
    
    <div className="bg-card/30 rounded-lg p-3 border border-border/30 mb-3">
      <div className="text-xs text-muted-foreground mb-2">Comissões do Mês</div>
      <div className="space-y-2">
        {[
          { name: "Carlos Silva", value: "R$ 2.450", services: 48 },
          { name: "André Santos", value: "R$ 1.980", services: 42 },
          { name: "Pedro Lima", value: "R$ 1.650", services: 35 },
        ].map((barber, i) => (
          <div key={i} className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Scissors className="w-3 h-3 text-primary" />
            </div>
            <span className="text-xs text-foreground flex-1">{barber.name}</span>
            <span className="text-[10px] text-muted-foreground">{barber.services} serviços</span>
            <span className="text-xs font-medium text-primary">{barber.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Jackson Agent Preview Slide
const JacksonSlide = () => (
  <div className="bg-background/95 rounded-xl border border-border/50 p-4 md:p-6 h-full">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <Bot className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">Jackson — Gerente Virtual</span>
      <span className="ml-auto flex items-center gap-1 text-[10px] text-green-400">
        <CheckCircle className="w-3 h-3" /> Online 24h
      </span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Chat simulation */}
      <div className="bg-card/30 rounded-lg p-3 border border-border/30">
        <div className="text-xs text-muted-foreground mb-3">Conversa no WhatsApp</div>
        <div className="space-y-2">
          {[
            { from: "client", text: "Oi, quero agendar um corte pra amanhã", delay: 0 },
            { from: "jackson", text: "Olá! Sou o Jackson, assistente da Barbearia. 😊 Temos horários às 10h, 14h e 16h. Qual prefere?", delay: 100 },
            { from: "client", text: "14h tá ótimo!", delay: 200 },
            { from: "jackson", text: "Perfeito! Agendado para amanhã às 14h com Carlos. Preciso do seu nome completo para o cadastro.", delay: 300 },
            { from: "client", text: "Rafael Costa", delay: 400 },
            { from: "jackson", text: "Pronto, Rafael! ✅ Cadastro feito e horário confirmado. Envio um lembrete amanhã de manhã!", delay: 500 },
          ].map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === "client" ? "justify-end" : "justify-start"} animate-fade-in`}
              style={{ animationDelay: `${msg.delay}ms` }}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                  msg.from === "client"
                    ? "bg-green-600/30 text-foreground"
                    : "bg-card/80 border border-border/30 text-foreground"
                }`}
              >
                {msg.from === "jackson" && (
                  <div className="flex items-center gap-1 mb-1">
                    <Bot className="w-3 h-3 text-primary" />
                    <span className="text-[10px] text-primary font-medium">Jackson</span>
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <div className="text-xs text-muted-foreground mb-2">O que o Jackson faz</div>
        {[
          { icon: MessageCircle, label: "Atende clientes pelo WhatsApp 24h", desc: "Responde perguntas e inicia atendimentos" },
          { icon: UserCheck, label: "Cadastra clientes automaticamente", desc: "Nome, telefone e preferências salvos" },
          { icon: Calendar, label: "Agenda horários sozinho", desc: "Verifica disponibilidade e confirma" },
          { icon: Bell, label: "Envia lembretes de confirmação", desc: "Reduz faltas em até 80%" },
          { icon: RefreshCcw, label: "Reativa clientes inativos", desc: "Campanhas automáticas de retorno" },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 bg-card/30 rounded-lg p-2 border border-border/30 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <item.icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <div className="text-xs font-medium text-foreground">{item.label}</div>
              <div className="text-[10px] text-muted-foreground">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Clientes Preview Slide
const ClientesSlide = () => (
  <div className="bg-background/95 rounded-xl border border-border/50 p-4 md:p-6 h-full">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <Users className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">Clientes</span>
      <span className="ml-auto text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">256 cadastrados</span>
    </div>
    
    <div className="space-y-2">
      {[
        { name: "João Silva", phone: "(11) 99999-0001", visits: 12, lastVisit: "Há 5 dias", vip: true },
        { name: "Pedro Santos", phone: "(11) 99999-0002", visits: 8, lastVisit: "Há 12 dias", vip: false },
        { name: "Carlos Lima", phone: "(11) 99999-0003", visits: 15, lastVisit: "Hoje", vip: true },
        { name: "Rafael Costa", phone: "(11) 99999-0004", visits: 3, lastVisit: "Há 30 dias", vip: false },
        { name: "Lucas Oliveira", phone: "(11) 99999-0005", visits: 6, lastVisit: "Há 7 dias", vip: false },
      ].map((client, i) => (
        <div key={i} className="flex items-center gap-3 bg-card/30 rounded-lg p-2 border border-border/30 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">{client.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-foreground truncate">{client.name}</span>
              {client.vip && <Star className="w-3 h-3 text-primary fill-primary" />}
            </div>
            <span className="text-[10px] text-muted-foreground">{client.phone}</span>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-foreground">{client.visits} visitas</div>
            <div className="text-[10px] text-muted-foreground">{client.lastVisit}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// WhatsApp Preview Slide
const WhatsAppSlide = () => (
  <div className="bg-background/95 rounded-xl border border-border/50 p-4 md:p-6 h-full">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
        <MessageCircle className="w-4 h-4 text-green-500" />
      </div>
      <span className="text-sm font-medium text-foreground">WhatsApp</span>
      <span className="ml-auto flex items-center gap-1 text-[10px] text-green-400">
        <CheckCircle className="w-3 h-3" /> Conectado
      </span>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex flex-col items-center justify-center bg-card/30 rounded-lg p-4 border border-border/30">
        <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center mb-2 animate-scale-in">
          <QrCode className="w-20 h-20 text-background" />
        </div>
        <span className="text-[10px] text-muted-foreground">Escaneie para conectar</span>
      </div>
      
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground mb-2">Mensagens Automáticas</div>
        {[
          { icon: Bell, label: "Lembrete de Agendamento", active: true },
          { icon: Gift, label: "Aniversário do Cliente", active: true },
          { icon: Clock, label: "Resgate de Inativos", active: true },
          { icon: CheckCircle, label: "Confirmação de Horário", active: false },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <item.icon className={`w-3 h-3 ${item.active ? 'text-green-400' : 'text-muted-foreground'}`} />
            <span className="text-foreground flex-1">{item.label}</span>
            <div className={`w-6 h-3 rounded-full ${item.active ? 'bg-green-500' : 'bg-muted'} flex items-center ${item.active ? 'justify-end' : 'justify-start'} p-0.5`}>
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Marketing Preview Slide
const MarketingSlide = () => (
  <div className="bg-background/95 rounded-xl border border-border/50 p-4 md:p-6 h-full">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <Megaphone className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">Marketing</span>
    </div>
    
    <div className="grid grid-cols-3 gap-2 mb-4">
      {[
        { label: "Enviadas", value: "1.250", icon: Send },
        { label: "Abertas", value: "89%", icon: CheckCircle },
        { label: "Conversões", value: "32%", icon: TrendingUp },
      ].map((stat, i) => (
        <div key={i} className="bg-card/50 rounded-lg p-2 border border-border/30 text-center animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <stat.icon className="w-4 h-4 text-primary mx-auto mb-1" />
          <div className="text-sm font-bold text-foreground">{stat.value}</div>
          <div className="text-[10px] text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
    
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground mb-1">Campanhas Recentes</div>
      {[
        { name: "Promoção de Verão", sent: 450, opens: "92%", status: "Enviada" },
        { name: "Black Friday", sent: 380, opens: "88%", status: "Enviada" },
        { name: "Aniversariantes Dezembro", sent: 45, opens: "95%", status: "Ativa" },
      ].map((campaign, i) => (
        <div key={i} className="flex items-center gap-2 bg-card/30 rounded-lg p-2 border border-border/30 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <Megaphone className="w-4 h-4 text-primary" />
          <div className="flex-1">
            <div className="text-xs font-medium text-foreground">{campaign.name}</div>
            <div className="text-[10px] text-muted-foreground">{campaign.sent} enviadas • {campaign.opens} abertas</div>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${campaign.status === 'Ativa' ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
            {campaign.status}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Multi-Unidades Preview Slide
const UnidadesSlide = () => (
  <div className="bg-background/95 rounded-xl border border-border/50 p-4 md:p-6 h-full">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <Building2 className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">Multi-Unidades</span>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {[
        { name: "Unidade Centro", address: "Rua Principal, 123", revenue: "R$ 18.500", appointments: 85, barbers: 4 },
        { name: "Unidade Shopping", address: "Av. Brasil, 456", revenue: "R$ 22.300", appointments: 102, barbers: 5 },
        { name: "Unidade Zona Sul", address: "Rua das Flores, 789", revenue: "R$ 15.200", appointments: 68, barbers: 3 },
        { name: "Unidade Norte", address: "Av. Norte, 321", revenue: "R$ 12.800", appointments: 54, barbers: 3 },
      ].map((unit, i) => (
        <div key={i} className="bg-card/30 rounded-lg p-3 border border-border/30 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">{unit.name}</span>
          </div>
          <div className="text-[10px] text-muted-foreground mb-2">{unit.address}</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs font-bold text-primary">{unit.revenue}</div>
              <div className="text-[8px] text-muted-foreground">Receita</div>
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">{unit.appointments}</div>
              <div className="text-[8px] text-muted-foreground">Agendamentos</div>
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">{unit.barbers}</div>
              <div className="text-[8px] text-muted-foreground">Profissionais</div>
            </div>
          </div>
        </div>
      ))}
    </div>
    
    {/* CTA Section */}
    <div className="mt-6 p-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl border border-primary/30 text-center animate-fade-in" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Star className="w-5 h-5 text-primary" />
        <span className="text-lg font-bold text-foreground">Pronto para transformar seu negócio?</span>
        <Star className="w-5 h-5 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Escolha o plano ideal e comece a ver resultados em poucos dias!
      </p>
      <a
        href="#precos"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById("precos");
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/30"
      >
        <CheckCircle className="w-4 h-4" />
        Conheça os Planos
      </a>
    </div>
  </div>
);

const slides = [
  {
    id: 0,
    title: "Bem-vindo ao BarberSoft",
    description: "Conheça o sistema completo para sua barbearia",
    icon: Volume2,
    component: IntroSlide,
  },
  {
    id: 1,
    title: "Painel de Controle Inteligente",
    description: "Visualize faturamento, agendamentos e métricas em tempo real",
    icon: LayoutDashboard,
    component: DashboardSlide,
  },
  {
    id: 2,
    title: "Agenda Completa",
    description: "Visualização diária, semanal e mensal. Filtre por profissional",
    icon: Calendar,
    component: AgendaSlide,
  },
  {
    id: 3,
    title: "Controle Financeiro Total",
    description: "Caixa, despesas, comissões e estoque em um só lugar",
    icon: DollarSign,
    component: FinanceiroSlide,
  },
  {
    id: 4,
    title: "Jackson — Gerente Virtual",
    description: "Atendimento automático 24h pelo WhatsApp com cadastro e agendamento",
    icon: Bot,
    component: JacksonSlide,
  },
  {
    id: 5,
    title: "Gestão de Clientes",
    description: "Histórico completo, aniversários e comportamento de visitas",
    icon: Users,
    component: ClientesSlide,
  },
  {
    id: 6,
    title: "Integração WhatsApp",
    description: "Atendimento automático 24h. Conecte escaneando o QR Code",
    icon: MessageCircle,
    component: WhatsAppSlide,
  },
  {
    id: 7,
    title: "Marketing Inteligente",
    description: "Campanhas em massa, lembretes de aniversário e resgate de inativos",
    icon: Megaphone,
    component: MarketingSlide,
  },
  {
    id: 8,
    title: "Gestão Multi-Unidades",
    description: "Gerencie todas as suas filiais de forma centralizada",
    icon: Building2,
    component: UnidadesSlide,
  },
];

export const DemoTourModal = ({ open, onOpenChange }: DemoTourModalProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<number, string>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  const playNarration = useCallback(async (slideIndex: number) => {
    if (isMuted) return;
    
    setAudioEnded(false);
    
    // Cancel any pending fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const currentAbortController = abortControllerRef.current;
    
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Check in-memory cache first (URL already fetched this session)
    if (audioCache.current.has(slideIndex)) {
      const audioUrl = audioCache.current.get(slideIndex)!;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setAudioEnded(true);
      audio.play().catch(console.error);
      return;
    }

    setIsLoadingAudio(true);

    try {
      // Call the generate-demo-audio edge function (returns cached URL or generates new)
      const response = await fetch(
        `https://lgrugpsyewvinlkgmeve.supabase.co/functions/v1/generate-demo-audio`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ 
            slideIndex,
            text: narrationTexts[slideIndex],
          }),
          signal: currentAbortController.signal,
        }
      );

      // Check if request was aborted
      if (currentAbortController.signal.aborted) return;

      if (!response.ok) {
        throw new Error(`Audio request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Check again if aborted
      if (currentAbortController.signal.aborted) return;
      
      const audioUrl = `${data.audioUrl}?t=${Date.now()}`;
      
      // Cache the URL for this session
      audioCache.current.set(slideIndex, audioUrl);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setAudioEnded(true);
      await audio.play();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Audio request for slide ${slideIndex} was cancelled`);
        return;
      }
      console.error("Failed to play narration:", error);
    } finally {
      setIsLoadingAudio(false);
    }
  }, [isMuted]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Play narration when slide changes
  useEffect(() => {
    if (open && !isMuted) {
      playNarration(currentSlide);
    }
  }, [currentSlide, open, isMuted, playNarration]);


  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "m" || e.key === "M") {
        setIsMuted((prev) => !prev);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, nextSlide, prevSlide, onOpenChange]);

  // Reset and cleanup on open/close
  useEffect(() => {
    if (open) {
      setCurrentSlide(0);
    } else {
      // Cancel any pending fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      // Stop audio when modal closes
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
  }, [open]);

  // Toggle mute handler
  const handleToggleMute = useCallback(() => {
    if (!isMuted) {
      // Muting - stop current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    } else {
      // Unmuting - play current slide narration
      playNarration(currentSlide);
    }
    setIsMuted((prev) => !prev);
  }, [isMuted, currentSlide, playNarration]);

  const CurrentSlideComponent = slides[currentSlide].component;
  const CurrentIcon = slides[currentSlide].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 bg-background/95 backdrop-blur-xl border-primary/20 overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-background to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <CurrentIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{slides[currentSlide].title}</h3>
              <p className="text-sm text-muted-foreground">{slides[currentSlide].description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Audio loading indicator - animated sound wave */}
            {isLoadingAudio && (
              <div className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-primary/10">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded-full animate-pulse"
                    style={{
                      height: `${8 + (i % 2) * 6}px`,
                      animationDelay: `${i * 150}ms`,
                      animationDuration: '0.6s',
                    }}
                  />
                ))}
                <span className="text-xs text-primary ml-2">Carregando...</span>
              </div>
            )}
            
            {/* Mute/Unmute button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleMute}
              className="text-muted-foreground hover:text-foreground"
              title={isMuted ? "Ativar narração (M)" : "Silenciar narração (M)"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
              title="Fechar (ESC)"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="h-full pt-20 pb-24 px-4 md:px-8 overflow-hidden">
          <div className="h-full flex items-center justify-center">
            <div className="w-full max-w-4xl animate-fade-in" key={currentSlide}>
              <CurrentSlideComponent />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-background to-transparent">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevSlide}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            
            {/* Progress Indicators */}
            <div className="flex items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "w-8 bg-primary"
                      : "w-2 bg-muted hover:bg-muted-foreground"
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={nextSlide}
              className={`transition-all duration-300 ${
                audioEnded && currentSlide < slides.length - 1
                  ? "text-primary animate-pulse scale-110 bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
          
          {/* Slide Counter */}
          <div className="text-center mt-2">
            <span className="text-xs text-muted-foreground">
              {currentSlide + 1} / {slides.length}
            </span>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};
