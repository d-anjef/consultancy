'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, TestTube2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function PushSettingsCard() {
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe, sendTest } =
    usePushNotifications();

  async function handleEnable() {
    const ok = await subscribe();
    if (ok) toast.success('Push notifications enabled 🔔');
    else toast.error('Could not enable. Check browser permissions.');
  }

  async function handleDisable() {
    const ok = await unsubscribe();
    if (ok) toast.success('Push notifications disabled');
    else toast.error('Could not disable');
  }

  async function handleTest() {
    const ok = await sendTest();
    if (ok) toast.info('Test notification sent — check your device!');
    else toast.error('Test failed');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSupported ? (
          <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5" />
            <p className="text-sm text-gray-700">
              Your browser doesn&apos;t support push notifications.
            </p>
          </div>
        ) : permission === 'denied' ? (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
            <div className="text-sm text-red-900">
              <p className="font-semibold">Notifications blocked</p>
              <p className="mt-1">
                You&apos;ve blocked notifications for this site. To enable them, click the lock icon
                in your browser&apos;s address bar and allow notifications.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Get instant alerts on your device for important updates
                </p>
              </div>
              {isSubscribed ? (
                <Badge className="bg-green-100 text-green-700 border border-green-200">
                  <Bell className="w-3 h-3 mr-1" /> Enabled
                </Badge>
              ) : (
                <Badge variant="outline">
                  <BellOff className="w-3 h-3 mr-1" /> Disabled
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {!isSubscribed ? (
                <Button
                  onClick={handleEnable}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Enable Notifications
                </Button>
              ) : (
                <>
                  <Button onClick={handleTest} variant="outline">
                    <TestTube2 className="w-4 h-4 mr-2" />
                    Send Test
                  </Button>
                  <Button onClick={handleDisable} variant="outline">
                    <BellOff className="w-4 h-4 mr-2" />
                    Disable
                  </Button>
                </>
              )}
            </div>

            <p className="text-xs text-gray-500 pt-2 border-t">
              Notifications work best when this website is added to your home screen or bookmarked.
              You will receive alerts for approvals, invoices, and important updates.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}