import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { MessageService, Message } from '@/lib/supabase';

interface InlineChatProps {
  sessionId: string;
  userName: string;
}

export default function InlineChat({ sessionId, userName }: InlineChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sessionId) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!sessionId) return;
    try {
      const data = await MessageService.getMessages(sessionId);
      setMessages(data);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
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
    if (!sessionId) return;
    if (!inputMessage.trim() && !selectedImage) return;

    setUploading(true);
    try {
      let fileUrl: string | null = null;
      let isQRCode = false;
      
      if (selectedImage) {
        fileUrl = await MessageService.uploadImage(selectedImage);
        isQRCode = true;
      }

      await MessageService.sendMessage(
        sessionId, 
        inputMessage, 
        false, 
        userName || null,
        fileUrl
      );

      if (isQRCode && fileUrl) {
        setTimeout(async () => {
          await MessageService.sendMessage(
            sessionId,
            '✅ QR-код получен!\n\n⏳ Ожидайте, данные для оплаты появятся в чате в течение 2х минут.\n\nНаш менеджер обработает ваш запрос.',
            true,
            null,
            null,
            'AliPay Service'
          );
          loadMessages();
        }, 1000);
      }

      setInputMessage('');
      clearImage();
      loadMessages();
    } catch (error: any) {
      console.error('Ошибка отправки:', error);
      alert('Ошибка отправки сообщения');
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
    <div className="border-t pt-4">
      <div className="mb-3">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Icon name="MessageCircle" size={16} />
          Чат с поддержкой
        </h4>
      </div>

      <div className="border rounded-lg bg-gray-50 mb-3 max-h-60 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-4">
            <p>Сообщений пока нет</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
          >
            <div className="flex flex-col gap-1 max-w-[80%]">
              {msg.is_admin && (
                <span className="text-xs text-gray-500 px-2">
                  {msg.manager_name || 'AliPay Service'}
                </span>
              )}
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  msg.is_admin
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'bg-primary text-white'
                }`}
              >
                {msg.image_url && (
                  <img 
                    src={msg.image_url} 
                    alt="Изображение" 
                    className="max-w-full rounded mb-2 cursor-pointer"
                    onClick={() => window.open(msg.image_url!, '_blank')}
                  />
                )}
                {msg.message && (
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                )}
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-xs opacity-70">
                    {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {!msg.is_admin && (
                    <span className="text-xs">
                      {msg.read_by_admin ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

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
  );
}
