import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { TicketStorage, Ticket, TicketMessage, onStorageChange } from '@/lib/localStorage';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let sid = localStorage.getItem('chat_session_id');
    if (!sid) {
      sid = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chat_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    if (isOpen && sessionId) {
      loadMessages();
      const interval = setInterval(loadMessages, 2000);
      const unsubscribe = onStorageChange(loadMessages);
      return () => {
        clearInterval(interval);
        unsubscribe();
      };
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = () => {
    if (!sessionId) return;
    
    const allTickets = TicketStorage.getAll();
    const ticket = allTickets.find(t => t.sessionId === sessionId);
    
    if (ticket) {
      setCurrentTicket(ticket);
      setMessages(ticket.messages);
    } else {
      setMessages([]);
      setCurrentTicket(null);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Файл слишком большой. Максимум 5 МБ');
        return;
      }
      setSelectedImage(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!sessionId || !currentTicket) {
      console.error('Тикет не найден');
      return;
    }

    if (!inputMessage.trim() && !selectedImage) return;

    setUploading(true);
    try {
      let imageUrl: string | undefined = undefined;
      
      if (selectedImage) {
        imageUrl = await convertToBase64(selectedImage);
      }

      TicketStorage.addMessage(currentTicket.id, 'client', inputMessage || '', imageUrl);

      setInputMessage('');
      clearImage();
      loadMessages();
    } catch (error) {
      console.error('Ошибка отправки:', error);
      alert('Ошибка отправки сообщения. Проверьте консоль.');
    } finally {
      setUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          data-chat-widget
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50"
          size="lg"
        >
          <Icon name="MessageCircle" size={24} />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-0 left-0 right-0 md:bottom-4 md:right-4 md:left-auto w-full md:max-w-md h-[100vh] md:h-[500px] md:w-96 shadow-2xl z-50 flex flex-col md:rounded-lg">
          <div className="flex items-center justify-between p-4 border-b bg-primary text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Icon name="MessageCircle" size={20} />
              <span className="font-semibold">Чат с поддержкой</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-primary-dark"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <Icon name="MessageCircle" size={48} className="mx-auto mb-2 text-gray-300" />
                <p>Начните диалог с нами!</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderType === 'admin' ? 'justify-start' : 'justify-end'}`}
              >
                <div className="flex flex-col gap-1">
                  {msg.senderType === 'admin' && msg.managerName && (
                    <span className="text-xs text-gray-500 px-2">
                      Менеджер {msg.managerName}
                    </span>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.senderType === 'admin'
                        ? 'bg-white text-gray-800 shadow'
                        : 'bg-primary text-white'
                    }`}
                  >
                    {msg.imageUrl && (
                      <img 
                        src={msg.imageUrl} 
                        alt="Изображение" 
                        className="max-w-full rounded mb-2 cursor-pointer"
                        onClick={() => window.open(msg.imageUrl, '_blank')}
                      />
                    )}
                    {msg.message && (
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    )}
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t bg-white rounded-b-lg">
            {imagePreview && (
              <div className="mb-2 relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-20 rounded border"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={clearImage}
                >
                  <Icon name="X" size={14} />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Icon name="Image" size={18} />
              </Button>
              <Input
                placeholder="Напишите сообщение..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={uploading}
              />
              <Button 
                onClick={sendMessage} 
                disabled={(!inputMessage.trim() && !selectedImage) || uploading}
              >
                {uploading ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="Send" size={18} />}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}