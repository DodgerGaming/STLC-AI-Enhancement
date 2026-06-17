from django.http import JsonResponse


def ping(request):
    return JsonResponse({'pong': True, 'message': 'Cutwise IMS API is up'})
