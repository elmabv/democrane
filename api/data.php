<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  file_put_contents('data.json', file_get_contents('php://input'));
} else {
  header('Content-Type: application/json');
  readfile('data.json');
}
