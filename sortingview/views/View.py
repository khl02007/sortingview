import os
import socket
from abc import abstractmethod
from typing import List, Union
import kachery_cloud as kcl
from kachery_cloud.TaskBackend import TaskBackend
import figurl as fig
import uuid


class View:
    """
    Base class for all views
    """
    def __init__(self, view_type: str, *, is_layout: bool=False) -> None:
        self.type = view_type
        self.id = _random_id()
        self.is_layout = is_layout
    @abstractmethod
    def to_dict(self) -> dict:
        return {}
    @abstractmethod
    def child_views(self) -> List['View']:
        return []
    @abstractmethod
    def register_task_handlers(self, task_backend: TaskBackend):
        pass
    def get_descendant_views_including_self(self):
        ret: List[View] = [self]
        for ch in self.child_views():
            a = ch.get_descendant_views_including_self()
            for v in a:
                ret.append(v)
        return ret
    def url(self, *, label: str, sorting_curation_uri: Union[None, str]=None, local: Union[bool, None]=None, electron: Union[bool, None]=None, project_id: Union[str, None]=None, listen_port: Union[int, None]=None):
        from .Box import Box
        from .LayoutItem import LayoutItem
        if electron is None:
            electron = os.getenv('SORTINGVIEW_ELECTRON', '0') == '1'
            if electron is True:
                local = True
        if electron is True and (local is not True):
            raise Exception('Cannot use electron without local')
        if local is None:
            local = os.getenv('SORTINGVIEW_LOCAL', '0') == '1'
        if listen_port is not None and (electron is not True):
            raise Exception('Cannot use listen_port without electron')
        if self.is_layout:
            all_views = self.get_descendant_views_including_self()
            data = {
                'type': 'SortingLayout',
                'layout': self.to_dict(),
                'views': [
                    {
                        'type': view.type,
                        'viewId': view.id,
                        'dataUri': _upload_data_and_return_uri(view.to_dict(), local=local)
                    }
                    for view in all_views if not view.is_layout
                ]
            }
            if sorting_curation_uri is not None:
                data['sortingCurationUri'] = sorting_curation_uri
                if project_id is None:
                    project_id = kcl.get_project_id()
            view_url = os.getenv('SORTINGVIEW_VIEW_URL', 'gs://figurl/spikesortingview-8')
            F = fig.Figure(view_url=view_url, data=data)
            url = F.url(label=label, project_id=project_id, local=local)
            if electron is True:
                F.electron(label=label, listen_port=listen_port)
            return url

        # Need to wrap it in a layout
        V = Box(
            direction='horizontal',
            items=[
                LayoutItem(self)
            ]
        )
        assert V.is_layout # avoid infinite recursion
        return V.url(label=label, sorting_curation_uri=sorting_curation_uri, local=local, electron=electron, project_id=project_id, listen_port=listen_port)
    def electron(self, *, label: str, listen_port: Union[int, None]=None):
        self.url(label=label, local=True, electron=True, listen_port=listen_port)
    def jupyter(self, *, height=600):
        import figurl_jupyter as fj
        url = self.url(label='jupyter', local=True, electron=False, listen_port=None)
        a = _parse_figurl_url(url)
        view_uri = a['v']
        data_uri = a['d']
        return fj.FigurlFigure(view_uri=view_uri, data_uri=data_uri, height=height)
    def run(self, *, label: str, port: int):
        if port == 0:
            # get an open port
            sock = socket.socket()
            sock.bind(('', 0))
            port = sock.getsockname()[1]
            sock.close()
        task_backend = TaskBackend(project_id=f'local:{port}')
        views = self.get_descendant_views_including_self()
        for view in views:
            view.register_task_handlers(task_backend)
        self.electron(label=label, listen_port=port)
        task_backend.run()

def _upload_data_and_return_uri(data, *, local: bool=False):
    return kcl.store_json(fig.serialize_data(data), local=local)

def _random_id():
    return str(uuid.uuid4())[-12:]

def _parse_figurl_url(uri: str):
    ind = uri.index('?')
    q = uri[ind + 1:]
    a = q.split('&')
    ret = {}
    for b in a:
        x = b.split('=')
        if len(x) == 2:
            ret[x[0]] = x[1]
    return ret